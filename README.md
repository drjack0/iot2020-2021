# IoT Course Repository - Academic Year 2020/2021

This is the main repository for the Internet of Things (IoT) course at Sapienza University of Rome.

## Sekkyone
[Sekkyone](http://sekkyone-website.s3-website-us-east-1.amazonaws.com/) is my individual project, a smart garbage bucket that gives you information about filling level, internal temperature and flames presence.

Imagine having a garbage collection system organized by filling, with the possibility of no longer having the full bucket on the street or, in the case, knowing if the bucket is full and waiting / going somewhere else to throw the garbage.

For more informations, open the directory!

## Installation
According to [Getting Started RIOT-Docs](https://doc.riot-os.org/getting-started.html), you can obtain the latest RIOT code from the [official repository](https://github.com/RIOT-OS/) where you can find also tutorials, examples and some other interesting stuffs.

### Brand new project
First, create an IoT main directory, a sub-project directory and create inside this one 2 files: <code>main.c</code> and <code>makefile</code>
```bash
mkdir iot-main
cd iot-main
mkdir my-project
cd my-project
touch main.c makefile
```
Then, inside the <code>iot-main</code> directory
```bash
git clone git://github.com/RIOT-OS/RIOT.git
```

Follow the [RIOT-OS Tutorials](https://github.com/RIOT-OS/Tutorials) for more infos!

### Cloning my repos
Clone my repo and also clone the RIOT directory
```bash
git clone https://github.com/drjack0/iot2020-2021.git
cd iot2020-2021
git clone git://github.com/RIOT-OS/RIOT.git
```

Follow the [RIOT-OS Tutorials](https://github.com/RIOT-OS/Tutorials) for more infos!

### IPv6 and LoRa assignments

In this folders are present two different network implementations for sekkyone project. Each version is provided with a FIT/IoT-Lab jupyter notebook and configuration files.
* [IPv6 folder](./sekkyone_mesh): Sekkyone implementation with ipv6 short-range mesh network
* [LoRa folder](./sekkyone_lora): Sekkyone implementation with LoRa long-range network