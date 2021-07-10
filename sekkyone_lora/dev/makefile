# Application name
APPLICATION = sekkyone_lora_network

# Application board - if no BOARD found in the environment, use this by default
BOARD ?= b-l072z-lrwan1

# RIOTBASE absolute path and Dev output
RIOTBASE ?= ./../RIOT
DEVELHELP ?= 1
QUIET ?= 1

# Main Modules to include
USEMODULE += xtimer

# LoRaWan modules
USEMODULE += sx1276
USEMODULE += semtech_loramac_rx

USEPKG += semtech-loramac

LORA_REGION ?= EU868

USEMODULE += shell
USEMODULE += ps

ifneq (,$(TTN_DEV_ID))
  CFLAGS += -DTTN_DEV_ID=\"$(TTN_DEV_ID)\"
endif

include $(RIOTBASE)/Makefile.include