#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <time.h>

#include "xtimer.h"

//include per MQTT
#include "net/emcute.h"
#include "net/ipv6/addr.h"
#include "msg.h"
#include "thread.h"
#include "shell.h"

#define DELAY (55000LU * US_PER_MS)

//DEFINE - EMCUTE
#ifndef EMCUTE_ID
#define EMCUTE_ID ("station1")
#endif
#define EMCUTE_PRIO (THREAD_PRIORITY_MAIN - 1)

#define NUMOFSUBS (1U)
#define TOPIC_MAXLEN (128U)

#define STATUS_LEN 5

//DEFINE - RANDOM VALUES
#define RANDOM_MAX_TEMP 35
#define RANDOM_MIN_TEMP 15
#define RANDOM_MAX_HUM 99
#define RANDOM_MIN_HUM 30
#define RANDOM_MAX_FLAME 99
#define RANDOM_MIN_FLAME 0
#define RANDOM_MAX_SAMPLE_FLAME 4000
#define RANDOM_MIN_SAMPLE_FLAME 0
#define RANDOM_MAX_FILLING 100
#define RANDOM_MIN_FILLING 0

#define MAIN_QUEUE_SIZE (8)

static msg_t _main_msg_queue[MAIN_QUEUE_SIZE];

static char status_MQTT[STATUS_LEN] = "";

typedef struct sensors{
    int temp;
    int hum;
    int sample_flame;
    int level_flame;
    int level_fill;
} t_sensors;

static char stack[THREAD_STACKSIZE_DEFAULT];

char stack_loop[THREAD_STACKSIZE_MAIN];
char stack_measure[THREAD_STACKSIZE_MAIN];

kernel_pid_t tmain, tmes;

static emcute_sub_t subscriptions[NUMOFSUBS];
static char topics[NUMOFSUBS][TOPIC_MAXLEN];

static void *emcute_thread(void *arg)
{
    (void)arg;
    emcute_run(CONFIG_EMCUTE_DEFAULT_PORT, EMCUTE_ID);
    return NULL;    /* should never be reached */
}

static void on_pub(const emcute_topic_t *topic, void *data, size_t len){
    char *in = (char *)data;

    char comm[len+1];

    printf("### got publication for topic '%s' [%i] ###\n",
           topic->name, (int)topic->id);
    for (size_t i = 0; i < len; i++) {
        //printf("%c", in[i]);
        comm[i] = in[i];
    }
    comm[len] = '\0';
    printf("%s", comm);

    //function for cleaning "status_MQTT" array buffer string
    for(size_t i = 0; i < STATUS_LEN; i++){
        if(i < len){
            status_MQTT[i] = in[i];
        } else {
            status_MQTT[i] = 0;
        }
    }

    puts("\n");
}

static int pub(char* topic, const char* data, int qos){
    emcute_topic_t t;
    unsigned flags = EMCUTE_QOS_0;

    switch(qos){
        case 1:
            flags |= EMCUTE_QOS_1;
            break;
        case 2:
            flags |= EMCUTE_QOS_2;
            break;
        default:
            flags |= EMCUTE_QOS_0;
            break;
    }

    t.name = MQTT_TOPIC_OUT;
    if(emcute_reg(&t) != EMCUTE_OK){
        puts("PUB ERROR: Unable to obtain Topic ID");
        return 1;
    }
    if(emcute_pub(&t, data, strlen(data), flags) != EMCUTE_OK){
        printf("PUB ERROR: unable to publish data to topic '%s [%i]'\n", t.name, (int)t.id);
        return 1;
    }

    printf("PUB SUCCESS: Published %s on topic %s\n", data, topic);
    return 0;
}

//This function create a stringified json collecting data from the sensors
const char* data_parse(t_sensors* sensors){
    static char json[128];

    sprintf(json, "{\"id\": \"%s\", \"temperature\": \"%d\", \"humidity\": \"%d\", \"levelFlame\": \"%d\", \"levelFill\": \"%d\"}",
                  EMCUTE_ID, sensors->temp, sensors->hum, sensors->level_flame, sensors->level_fill);
    
    return json;
}

static int random_temp(void){
    return (rand() % (RANDOM_MAX_TEMP + 1 - RANDOM_MIN_TEMP) + RANDOM_MIN_TEMP);
}
static int random_hum(void){
    return (rand() % (RANDOM_MAX_HUM + 1 - RANDOM_MIN_HUM) + RANDOM_MIN_HUM);
}
static int random_flame(void){
    return (rand() % (RANDOM_MAX_FLAME + 1 - RANDOM_MIN_FLAME) + RANDOM_MIN_FLAME);
}
static int random_filling(void){
    return (rand() % (RANDOM_MAX_FILLING + 1 - RANDOM_MIN_FILLING) + RANDOM_MIN_FILLING);
}
static int random_sample_flame(void){
    return (rand() % (RANDOM_MAX_SAMPLE_FLAME +1 - RANDOM_MIN_SAMPLE_FLAME) + RANDOM_MIN_SAMPLE_FLAME);
}

int setup_mqtt(void)
{
    /* initialize our subscription buffers */
    memset(subscriptions, 0, (NUMOFSUBS * sizeof(emcute_sub_t)));

    xtimer_sleep(10);

    printf("Dev_id: %s\n",EMCUTE_ID);

    /* start the emcute thread */
    thread_create(stack, sizeof(stack), EMCUTE_PRIO, 0, emcute_thread, NULL, "emcute");

    // connect to MQTT-SN broker
    printf("Connecting to MQTT-SN broker %s port %d.\n", SERVER_ADDR, SERVER_PORT);

    sock_udp_ep_t gw = {
        .family = AF_INET6,
        .port = SERVER_PORT
    };

    char *message = "connected";
    size_t len = strlen(message);

    /* parse address */
    if (ipv6_addr_from_str((ipv6_addr_t *)&gw.addr.ipv6, SERVER_ADDR) == NULL) {
        printf("error parsing IPv6 address\n");
        return 1;
    }

    if (emcute_con(&gw, true, MQTT_TOPIC_OUT, message, len, 0) != EMCUTE_OK) {
        printf("error: unable to connect to [%s]:%i\n", SERVER_ADDR, (int)gw.port);
        return 1;
    }

    printf("Successfully connected to gateway at [%s]:%i\n", SERVER_ADDR, (int)gw.port);

    /* setup subscription to topic*/
    
    unsigned flags = EMCUTE_QOS_0;
    subscriptions[0].cb = on_pub;
    strcpy(topics[0], MQTT_TOPIC_IN);
    subscriptions[0].topic.name = MQTT_TOPIC_IN;

    if (emcute_sub(&subscriptions[0], flags) != EMCUTE_OK) {
        printf("error: unable to subscribe to %s\n", MQTT_TOPIC_IN);
        return 1;
    }

    printf("Now subscribed to %s\n", MQTT_TOPIC_IN);

    return 1;
}

int started = -1;
void *main_loop(void *arg){
    (void)arg;
    tmain = thread_getpid();
    t_sensors sensors;

    xtimer_ticks32_t last= xtimer_now();
    while(1) {
        srand(time(NULL));
        sensors.temp = random_temp();
        sensors.hum = random_hum();
        sensors.sample_flame = random_sample_flame();
        sensors.level_flame = random_flame();
        sensors.level_fill = random_filling();

        printf("[MQTT] Publishing data to MQTT Broker\n");
        pub(MQTT_TOPIC_OUT, data_parse(&sensors), 0);
        //printf("json %s",data_parse(&sensors));
        xtimer_sleep(2);

        printf("\n");

        xtimer_periodic_wakeup(&last, DELAY);
        
    }
}

static int cmd_status(int argc, char *argv[]){
    (void)argc;
    (void)argv;

    printf("WELCOME!!!\n");
    return 0;
}

static int cmd_mqtt_status(int argc, char *argv[]){
    (void)argc;
    (void)argv;

    printf("MQTT BROKER ADDRESS %s PORT %d\n", SERVER_ADDR, SERVER_PORT);
    return 0;
}

static const shell_command_t shell_commands[] = {
    { "status", "get a status report", cmd_status },
    { "mqtt_status", "mqtt status report", cmd_mqtt_status},
    { NULL, NULL, NULL }
};

int main(void){

    msg_init_queue(_main_msg_queue, MAIN_QUEUE_SIZE);

    puts("Sekkyone - Smart Garbage Bucket - IoT Lab Simulated\n");
    puts("Setting up MQTT-SN.\n");
    setup_mqtt();
    xtimer_sleep(3);

    
    puts("RIOT network stack Application");

    puts("[###STARTING SIMULATED MEASUREMENTS###]\n\n");
    thread_create(stack_loop, sizeof(stack_loop), EMCUTE_PRIO, 0, main_loop, NULL, "main_loop");
    puts("Thread started successfully!");

    char line_buf[SHELL_DEFAULT_BUFSIZE];
    shell_run(shell_commands, line_buf, SHELL_DEFAULT_BUFSIZE);
    return 0;
}