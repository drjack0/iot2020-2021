#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <time.h>

#include "xtimer.h"
#include "periph/gpio.h"
#include "periph/adc.h"
#include "analog_util.h"

#define ADC_IN_USE ADC_LINE(0)
#define ADC_RES ADC_RES_12BIT

#include "fmt.h"
#include "dht.h"
#include "dht_params.h"
#include "periph/pm.h"
#include "periph/rtc.h"

#include "srf04.h"
#include "srf04_params.h"

#include "hd44780.h"
#include "hd44780_params.h"

//include per MQTT
#include "net/emcute.h"

#define DHT_PARAM_TYPE (DHT11)

#define DELAY (55000LU * US_PER_MS)

//DEFINE PER EMCUTE
#ifndef EMCUTE_ID
#define EMCUTE_ID ("station1")
#endif
#define EMCUTE_PRIO (THREAD_PRIORITY_MAIN - 1)

#define NUMOFSUBS (1U)
#define TOPIC_MAXLEN (128U)

#define STATUS_LEN 5

static char status_MQTT[STATUS_LEN] = "";

typedef struct sensors{
    char temp[10];
    char hum[10];
    int sample_flame;
    int level_flame;
    int distance;
} t_sensors;

hd44780_t dev_lcd;

static char stack[THREAD_STACKSIZE_DEFAULT];

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
    printf("### got publication for topic '%s' [%i] ###\n",
           topic->name, (int)topic->id);
    for (size_t i = 0; i < len; i++) {
        printf("%c", in[i]);
    }
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

    sprintf(json, "{\"id\": \"%s\", \"temperature\": \"%s\", \"humidity\": \"%s\", \"levelFlame\": \"%d\", \"distance\": \"%d\"}",
                  EMCUTE_ID, sensors->temp, sensors->hum, sensors->level_flame, sensors->distance);
    
    return json;
}

int setup_mqtt(void)
{
    /* initialize our subscription buffers */
    memset(subscriptions, 0, (NUMOFSUBS * sizeof(emcute_sub_t)));

    /* start the emcute thread */
    thread_create(stack, sizeof(stack), EMCUTE_PRIO, 0, emcute_thread, NULL, "emcute");

    // connect to MQTT-SN broker
    printf("Connecting to MQTT-SN broker %s port %d.\n", SERVER_ADDR, SERVER_PORT);

    sock_udp_ep_t gw = {
        .family = AF_INET6,
        .port = SERVER_PORT
    };
    char *topic_out = MQTT_TOPIC_OUT;
    char *message = "connected";
    size_t len = strlen(message);

    /* parse address */
    if (ipv6_addr_from_str((ipv6_addr_t *)&gw.addr.ipv6, SERVER_ADDR) == NULL) {
        printf("error parsing IPv6 address\n");
        return 1;
    }

    if (emcute_con(&gw, true, topic_out, message, len, 0) != EMCUTE_OK) {
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

int main(void){
    puts("Sekkyone - Smart Garbage Bucket\n");

    printf("[RIOT DHT11 SENSOR - TEMP & HUM] ");

    dht_params_t my_params;
    my_params.pin = GPIO_PIN(PORT_A, 9);
    my_params.type = DHT11;
    my_params.in_mode = DHT_PARAM_PULL;

    dht_t dev_dht;

    if(dht_init(&dev_dht, &my_params) == DHT_OK){
        printf("DHT sensor connected\n");
    } else {
        printf("Failed to connect to dht sensor\n");
        return 1;
    }

    printf("[RIOT SRF04 SENSOR - DISTANCE] ");

    srf04_params_t my_params_us;
    my_params_us.trigger = GPIO_PIN(PORT_A, 5);
    my_params_us.echo = GPIO_PIN(PORT_A, 6);

    srf04_t dev_us;

    if(srf04_init(&dev_us, &my_params_us) == SRF04_OK){
        printf("SRF04 sensor connected\n");
    } else {
        printf("Failed to connect to srf04 sensor\n");
        return 1;
    }

    printf("[RIOT ANALOG SENSOR - FLAME] ");

    if(adc_init(ADC_IN_USE) < 0){
        printf("Initialization of ADC_LINE(%u)\n", ADC_IN_USE);
        return 1;
    } else {
        printf("Successfully initialized ADC_LINE(%u)\n", ADC_IN_USE);
    }

    xtimer_ticks32_t last = xtimer_now();
    int sample = 0;
    int flame = 0;
    int16_t temp, hum;
    int distance;
    char fill_level[2];

    t_sensors sensors;

    printf("[DISPLAY INITIALIZATION] ");
    if (hd44780_init(&dev_lcd, &hd44780_params[0]) != 0) {
        puts("[FAILED]");
        return 1;
    } 
    else {
        printf("Initializing display...");
        hd44780_clear(&dev_lcd);
        hd44780_home(&dev_lcd);
        printf("Now successfully initialized LCD Display\n");
    }

    printf("Setting up MQTT-SN.\n");
    setup_mqtt();
    xtimer_sleep(3);

    printf("[###STARTING MEASUREMENTS###]\n\n");
    xtimer_sleep(2);

    while(1) {
        
        if(dht_read(&dev_dht,&temp,&hum) != DHT_OK){
            printf("Error reading temp & hum values\n");
        }

        char temp_s[10];
        size_t n = fmt_s16_dfp(temp_s, temp, -1);
        temp_s[n] = '\0';

        char hum_s[10];
        n = fmt_s16_dfp(hum_s, hum, -1);
        hum_s[n] = '\0';

        printf("DHT values - temp: %s°C - relative humidity: %s%%\n", temp_s, hum_s);
        
        if(srf04_read(&dev_us) == SRF04_ERR_INVALID){
            printf("No valid measurement is available!\n");
        }
        distance = srf04_get_distance(&dev_us);
        printf("SRF04 distance: %d mm\n", distance);
        printf("BUCKET HEIGHT: %d mm\n", atoi(BUCKET_HEIGHT));
        printf("Bucket fill level: %d%%\n",  (int)(100.0 * (1.0 * distance) / atoi(BUCKET_HEIGHT)));

        sample = adc_sample(ADC_IN_USE, ADC_RES);
        flame = adc_util_map(sample, ADC_RES, 100, 0); //note inverted values in function, cause pull up / pull down issues
        if(sample < 0){
            printf("ADC_LINE(%u): selected resolution not applicable\n", ADC_IN_USE);
        } else {
            printf("ADC_LINE(%u): raw value: %i, flame: %i\n", ADC_IN_USE, sample, flame);
        }

        strcpy(sensors.temp, temp_s);
        strcpy(sensors.hum, hum_s);
        sensors.sample_flame = sample;
        sensors.level_flame = flame;
        sensors.distance = distance;

        printf("[MQTT] Publishing data to MQTT Broker\n");
        pub(MQTT_TOPIC_OUT, data_parse(&sensors), 0);
        xtimer_sleep(2);

        //Long list of LCD print functions...
        hd44780_clear(&dev_lcd);
        hd44780_home(&dev_lcd);
        hd44780_print(&dev_lcd, "TH: ");
        hd44780_print(&dev_lcd, temp_s);
        hd44780_write(&dev_lcd, (char)223);
        hd44780_print(&dev_lcd, "C ");
        hd44780_print(&dev_lcd, hum_s);
        hd44780_print(&dev_lcd, "%");
        
        hd44780_set_cursor(&dev_lcd,0,1);
        sprintf(fill_level,"%d", (int)(100.0 * (1.0 * distance) / atoi(BUCKET_HEIGHT)));
        hd44780_print(&dev_lcd,"F: ");
        hd44780_print(&dev_lcd, fill_level);
        hd44780_print(&dev_lcd, "%");
        hd44780_print(&dev_lcd, " S: ");
        hd44780_print(&dev_lcd, status_MQTT);
        hd44780_home(&dev_lcd);

        printf("\n");

        xtimer_periodic_wakeup(&last, DELAY);
        
    }
    return 0;
}