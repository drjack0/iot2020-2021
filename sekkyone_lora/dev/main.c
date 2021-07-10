#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <math.h>

#include "net/loramac.h"
#include "semtech_loramac.h"

#include "msg.h"
#include "shell.h"
#include "thread.h"
#include "xtimer.h"

#ifndef TTN_DEV_ID
#define TTN_DEV_ID ("station1")
#endif

#define DELAY (55000LU * US_PER_MS)

#define MES_ITER 5
#define MES_SLEEP_TIME 1

#define RECV_MSG_QUEUE (4U)

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

static msg_t _recv_queue[RECV_MSG_QUEUE];
static char _recv_stack[THREAD_STACKSIZE_DEFAULT];

typedef struct sensors{
    int temp;
    int hum;
    int sample_flame;
    int level_flame;
    int level_fill;
} t_sensors;


static semtech_loramac_t loramac;

static const uint8_t deveui[LORAMAC_DEVEUI_LEN] = {0x00, 0x11, 0xB1, 0x61, 0xEF, 0xA7, 0xE3, 0x28};
static const uint8_t appeui[LORAMAC_APPEUI_LEN] = {0x70, 0xB3, 0xD5, 0x7E, 0xD0, 0x04, 0x3E, 0x6C};
static const uint8_t appkey[LORAMAC_APPKEY_LEN] = {0x4D, 0xAD, 0x5F, 0x48, 0x61, 0x40, 0xC2, 0x90, 0x94, 0x1A, 0x16, 0xBA, 0x39, 0x99, 0xDB, 0xCA};

static char encoding_table[] = {'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H',
                                'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P',
                                'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X',
                                'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f',
                                'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n',
                                'o', 'p', 'q', 'r', 's', 't', 'u', 'v',
                                'w', 'x', 'y', 'z', '0', '1', '2', '3',
                                '4', '5', '6', '7', '8', '9', '+', '/'};
static int mod_table[] = {0, 2, 1};
int dev_id = -1;

int first = 1;
static void *_recv(void *arg){
    (void)arg;
    msg_init_queue(_recv_queue, RECV_MSG_QUEUE);
    while(1){
        semtech_loramac_recv(&loramac);
        loramac.rx_data.payload[loramac.rx_data.payload_len] = 0;
        printf("Data received: %s\tPort: %d\n", (char *)loramac.rx_data.payload, loramac.rx_data.port);

        char * msg = (char *)loramac.rx_data.payload;
        if(first == 0){
            printf("Parsing command... (new message)\n");
            printf("%s\n", msg);
            //parse_command(msg);
            first = 1;
        } else {
            printf("Old message, ignored\n");
        }
    }
    return NULL;
}

int lora_init(void){
    dev_id = TTN_DEV_ID[strlen(TTN_DEV_ID)-1] - '0';
    printf("dev id: %d\n", dev_id);

    semtech_loramac_init(&loramac);
    semtech_loramac_set_deveui(&loramac, deveui);
    semtech_loramac_set_appeui(&loramac, appeui);
    semtech_loramac_set_appkey(&loramac, appkey);

    semtech_loramac_set_dr(&loramac, 5);

    if(semtech_loramac_join(&loramac, LORAMAC_JOIN_OTAA) != SEMTECH_LORAMAC_JOIN_SUCCEEDED){
        puts("Join procedure failed");
        return 1;
    }
    puts("Join procedure succeeded");

    puts("Starting recv thread");
    thread_create(_recv_stack, sizeof(_recv_stack), THREAD_PRIORITY_MAIN - 1, 0, _recv, NULL, "recv thread");
    return 0;
}

char *base64_encode(const char *data, size_t input_length, size_t *output_length){
    *output_length = 4 * ((input_length + 2) / 3);

    char *encoded_data = malloc(*output_length);
    if(encoded_data == NULL) return NULL;

    for(size_t i = 0, j = 0; i < input_length;){
        uint32_t octet_a = i < input_length ? (unsigned char)data[i++] : 0;
        uint32_t octet_b = i < input_length ? (unsigned char)data[i++] : 0;
        uint32_t octet_c = i < input_length ? (unsigned char)data[i++] : 0;

        uint32_t triple = (octet_a << 0x10) + (octet_b << 0x08) + octet_c;

        encoded_data[j++] = encoding_table[(triple >> 3 * 6) & 0x3F];
        encoded_data[j++] = encoding_table[(triple >> 2 * 6) & 0x3F];
        encoded_data[j++] = encoding_table[(triple >> 1 * 6) & 0x3F];
        encoded_data[j++] = encoding_table[(triple >> 0 * 6) & 0x3F];
    }

    for (int i = 0; i < mod_table[input_length % 3]; i++){
        encoded_data[*output_length - 1 - i] = '=';
    }
    return encoded_data;
}



/*int parse_command(char *command){

}*/

int sec = 0;
void send(const char* message){
    size_t inl = strlen(message);
    size_t outl;

    char* encoded = base64_encode(message, inl, &outl);
    printf("%s\n", encoded);
    uint8_t status = semtech_loramac_send(&loramac, (uint8_t *)message, strlen(message));

    if(status != SEMTECH_LORAMAC_TX_DONE){
        printf("Cannot send message '%s'\n", message);
    } else {
        printf("Message '%s' sent\n", message);
        if(sec == 1){
            first = 0;
        }
        sec = 1;
    }
}

char stack_loop[THREAD_STACKSIZE_MAIN];
char stack_measure_temp[THREAD_STACKSIZE_MAIN];
char stack_measure_hum[THREAD_STACKSIZE_MAIN];
char stack_measure_flame[THREAD_STACKSIZE_MAIN];
char stack_measure_fill[THREAD_STACKSIZE_MAIN];

kernel_pid_t tmain;
kernel_pid_t t_temp, t_hum, t_flame, t_fill;

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

int last_temp = -1;
void *temp_mes(void *arg){
    srand(time(NULL));
    (void)arg;
    int temp = 0;
    int avg_temp = 0;
    const int iterations = MES_ITER;
    int i = 0;

    printf("measuring temperature...\n");
    while (i < iterations){
        temp = random_temp();
        avg_temp += temp;
        i++;
        xtimer_sleep(MES_SLEEP_TIME);
    }

    avg_temp /= iterations;
    avg_temp = round(avg_temp);
    last_temp = avg_temp;
    msg_t msg;
    msg.content.value = avg_temp;
    msg_send(&msg, tmain);

    return NULL;
}

int last_hum = -1;
void *hum_mes(void *arg){
    srand(time(NULL));
    (void)arg;
    int hum = 0;
    int avg_hum = 0;
    const int iterations = MES_ITER;
    int i = 0;

    printf("measuring humidity...\n");
    while (i < iterations){
        hum = random_hum();
        avg_hum += hum;
        i++;
        xtimer_sleep(MES_SLEEP_TIME);
    }

    avg_hum /= iterations;
    avg_hum = round(avg_hum);
    last_hum = avg_hum;
    msg_t msg;
    msg.content.value = avg_hum;
    msg_send(&msg, tmain);

    return NULL;
}

int last_flame = -1;
void *flame_mes(void *arg){
    srand(time(NULL));
    (void)arg;
    int flame = 0;
    int avg_flame = 0;
    const int iterations = MES_ITER;
    int i = 0;

    printf("measuring flame level...\n");
    while (i < iterations){
        flame = random_flame();
        avg_flame += flame;
        i++;
        xtimer_sleep(MES_SLEEP_TIME);
    }

    avg_flame /= iterations;
    avg_flame = round(avg_flame);
    last_flame = avg_flame;
    msg_t msg;
    msg.content.value = avg_flame;
    msg_send(&msg, tmain);

    return NULL;
}

int last_fill = -1;
void *fill_mes(void *arg){
    srand(time(NULL));
    (void)arg;
    int fill = 0;
    int avg_fill = 0;
    const int iterations = MES_ITER;
    int i = 0;

    printf("measuring filling level...\n");
    while (i < iterations){
        fill = random_filling();
        avg_fill += fill;
        i++;
        xtimer_sleep(MES_SLEEP_TIME);
    }

    avg_fill /= iterations;
    avg_fill = round(avg_fill);
    last_fill = avg_fill;
    msg_t msg;
    msg.content.value = avg_fill;
    msg_send(&msg, tmain);

    return NULL;
}

//This function create a stringified json collecting data from the sensors
const char* data_parse(t_sensors* sensors){
    static char json[128];

    sprintf(json, "{\"id\": \"%s\", \"temperature\": \"%d\", \"humidity\": \"%d\", \"levelFlame\": \"%d\", \"levelFill\": \"%d\"}",
                  TTN_DEV_ID, sensors->temp, sensors->hum, sensors->level_flame, sensors->level_fill);
    
    return json;
}

int temp_high_threshold = 28;
int temp_low_threshold = 0;
int hum_high_threshold = 75;
int hum_low_threshold = 20;
int flame_threshold = 25;
int fill_threshold = 60;

void *main_loop(void *arg){
    
    (void)arg;
    tmain = thread_getpid();
    t_sensors sensors;
    xtimer_ticks32_t last = xtimer_now();

    while(1){
        srand(time(NULL));
        sensors.sample_flame = random_sample_flame();
        t_temp = thread_create(stack_measure_temp, sizeof(stack_measure_temp), THREAD_PRIORITY_MAIN - 1, THREAD_CREATE_STACKTEST, temp_mes, NULL, "temp mes");
        t_hum = thread_create(stack_measure_hum, sizeof(stack_measure_hum), THREAD_PRIORITY_MAIN - 2, THREAD_CREATE_STACKTEST, hum_mes, NULL, "hum mes");
        t_flame = thread_create(stack_measure_flame, sizeof(stack_measure_flame), THREAD_PRIORITY_MAIN - 3, THREAD_CREATE_STACKTEST, flame_mes, NULL, "flame mes");
        t_fill = thread_create(stack_measure_fill, sizeof(stack_measure_fill), THREAD_PRIORITY_MAIN - 4, THREAD_CREATE_STACKTEST, fill_mes, NULL, "fill mes");

        msg_t msg_temp, msg_hum, msg_flame, msg_fill;

        msg_receive(&msg_temp);
        if (msg_temp.sender_pid == t_temp){
            sensors.temp = msg_temp.content.value;
        } else if(msg_temp.sender_pid == t_hum){
            sensors.hum = msg_temp.content.value;
        } else if(msg_temp.sender_pid == t_flame){
            sensors.level_flame = msg_temp.content.value;
        } else {
            sensors.level_fill = msg_temp.content.value;
        }

        msg_receive(&msg_hum);
        if (msg_hum.sender_pid == t_hum){
            sensors.hum = msg_temp.content.value;
        } else if(msg_hum.sender_pid == t_flame){
            sensors.level_flame = msg_temp.content.value;
        } else if(msg_hum.sender_pid == t_fill){
            sensors.level_fill = msg_temp.content.value;
        } else {
            sensors.temp = msg_temp.content.value;
        }

        msg_receive(&msg_flame);
        if (msg_flame.sender_pid == t_flame){
            sensors.level_flame = msg_temp.content.value;
        } else if(msg_flame.sender_pid == t_fill){
            sensors.level_fill = msg_temp.content.value;
        } else if(msg_flame.sender_pid == t_temp){
            sensors.temp = msg_temp.content.value;
        } else {
            sensors.hum = msg_temp.content.value;
        }

        msg_receive(&msg_fill);
        if (msg_fill.sender_pid == t_fill){
            sensors.level_fill = msg_temp.content.value;
        } else if(msg_fill.sender_pid == t_temp){
            sensors.temp = msg_temp.content.value;
        } else if(msg_fill.sender_pid == t_hum){
            sensors.hum = msg_temp.content.value;
        } else {
            sensors.level_flame = msg_temp.content.value;
        }

        printf("[MQTT] Publishing data to MQTT Broker\n");
        if((sensors.temp > temp_high_threshold || sensors.temp < temp_low_threshold) || (sensors.hum > hum_high_threshold || sensors.hum < hum_low_threshold) || sensors.level_fill > fill_threshold || sensors.level_flame < flame_threshold){
            send(data_parse(&sensors));
        }

        printf("\n");
        xtimer_periodic_wakeup(&last, DELAY);
        
    }
}

static int cmd_welcome(int argc, char *argv[]){
    (void)argc;
    (void)argv;

    puts("Welcome to RIOT\n");
    return 0;
}

static int _board_handler(int argc, char *argv[]){
    (void)argc;
    (void)argv;
    puts(RIOT_BOARD);
    return 0;
}

static int _dev_id(int argc, char *argv[]){
    (void)argc;
    (void)argv;
    puts(TTN_DEV_ID);
    return 0;
}

static const shell_command_t shell_commands[] = {
    {"welcome", "get a welcome message", cmd_welcome},
    {"board", "get board name", _board_handler},
    {"lora", "get dev_id", _dev_id},
    { NULL, NULL, NULL}
};

int main(void){

    puts("Sekkyone - Smart Garbage Bucket - IoT Lab Simulated\n");
    puts("Setting up LoRa.\n");
    lora_init();
    xtimer_sleep(2);

    
    puts("RIOT network stack Application");
    puts("[###STARTING SIMULATED MEASUREMENTS###]\n\n");
    thread_create(stack_loop, sizeof(stack_loop), THREAD_PRIORITY_MAIN, 0, main_loop, NULL, "main_loop");
    puts("Thread started successfully!");

    char line_buf[SHELL_DEFAULT_BUFSIZE];
    shell_run(shell_commands, line_buf, SHELL_DEFAULT_BUFSIZE);
    return 0;
}