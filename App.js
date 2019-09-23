import React, { Component } from "react";
import {  
  Platform,
  ScrollView,
  Switch,
  Text,
  SafeAreaView,
  View,
  ActivityIndicator,
  Modal,
  Alert,
} from "react-native";

import BluetoothSerial from "react-native-bluetooth-serial-next";

import { Buffer } from "buffer";

const iconv = require("iconv-lite");
global.Buffer = Buffer;

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.events = null;
    this.state = {
      isEnabled: false,
      device: null,
      devices: [],
      scanning: false,
      processing: false,
    };
  }

  componentDidMount() {
    this.isEnabled()
  }

  // VERIFICA SE BLUETOOTH ESTA ATIVADO - STATUS ok
  isEnabled = () => {
    BluetoothSerial.isEnabled()
    .then((res) => {
    
      if(res) {

        console.log("Sucesso isEnabled")
        console.log(res)

        this.setState({isEnabled: res}) // BLUETOOTH LIGADO

        this.listar_bluetooth()
  
      } else {

        this.setState({isEnabled: res})  // BLUETOOTH DESLIGADO

        Alert.alert(
          'APP TOOLS',
          'Precisamos que ative seu bluetooth!',  
          [
              { text: 'OK', onPress: () => console.log('OK Pressed') },
          ],
      );
      }
    })
  }

  // LISTAR BLUETOOTHS PAREADOS ok
  listar_bluetooth = async () => {

    this.events = this.props.events;

    //this.discoverUnpairedDevices() // devices nao pareados

    try {

      const [isEnabled, devices] = await Promise.all([
        BluetoothSerial.isEnabled(),  // objeto
        BluetoothSerial.list(),
      ]);

      this.setState({
        isEnabled,
        devices: devices.map(device => ({
          ...device,
          paired: true,
          connected: false,
        })),
      });

      console.log("DADOS DOS DEVICES")
      console.log(this.state.devices)

      this.conectar_bluetooth() // remover daqui chamar no click no item desejado

    } catch (e) {
      console.log("ERRO AO BUSCAR OS DISPOSITIVOS")
      console.log(e.message)
      alert(e.message);
    }
  }

  // CONECTAR COM UM ITEM BLUETOOTH RESPECTIVO
  conectar_bluetooth = async() => {

    try {

      const connected = await BluetoothSerial.device('98:D3:32:30:96:36').connect();

      if (connected) {

        // TESTE ENVIO COMANDO
        await BluetoothSerial.device('98:D3:32:30:96:36').write('QTT;ID=xxxx;#8001;*4E')
          .then((resposta) => {

            const currentServices = BluetoothSerial.getServices()
              .then((res) => {
                console.log("MEUS SERVICOS getServices")
                console.log(res)
              })


            // RECUPERA RESPOSTA DO ENVIO DO COMANDO  
            const data = BluetoothSerial.readFromDevice()
            .then((res) => {
              console.log("MEUS SERVICOS readFromDevice")
              console.log(res)
            })
            .catch((erro) => {
              console.log('Erro ao recuperar a resposta do bluetooth!')
              console.log(erro)
            })

            console.log('Voce conseguiu enviar comando')
            console.log(resposta)

            console.log("MEUS SERVICOS")
            console.log(currentServices)
            console.log(data)


            //this.writePackets('98:D3:32:30:96:36', 'QTT;ID=xxxx;#8001;*4E', packetSize = 64)
          })
          .catch((erro) => {
            console.log('Voce nao conseguiu enviar comando')
            console.log(erro)
          })

        //alert(
          //`Conectado com ${connected.name} - ${connected.id}`
        //);

        this.setState(({ devices, device }) => ({
          processing: false,
          device: {
            ...device,
            ...connected,
            connected: true,
          },
          devices: devices.map(v => {
            if (v.id === connected.id) {
              return {
                ...v,
                ...connected,
                connected: true,
              };
            }

            return v;
          }),
        }));
      } else {
        alert(`Failed to connect to device <${id}>`);
        this.setState({ processing: false });
      }
    } catch (e) {
      alert(e.message);
      this.setState({ processing: false });
    }

  }

  /*requestEnable = async () => {

    await BluetoothSerial.requestEnable()
      .then((res) => {
        console.log("Sucesso requestEnable")
        console.log(res)
      })
      .catch((erro) => {
        console.log("Erro requestEnable")
        console.log(erro.message)
      })
    
  };
  */

  /*toggleBluetooth = async value => {
    
    try {
      if (value) {

        console.log("toggleBluetooth")
        console.log(value)

        await BluetoothSerial.enable();
      } else {
        await BluetoothSerial.disable();
      }
    } catch (e) {
      alert(e.message);
    }
  };
  */

  // LISTA TODOS OS DISPOSITIVOS NAO PAREADOS
  discoverUnpairedDevices = async () => {
    try {
      const unpairedDevices = await BluetoothSerial.listUnpaired();

      this.setState(({ devices }) => ({
        scanning: false,
        devices: devices
          .map(device => {
            const found = unpairedDevices.find(d => d.id === device.id);

            if (found) {

              console.log("TODOS OS DISPOSITIVOS - NAO PARELHADOS")
              console.log(e.message)

              return {
                ...device,
                ...found,
                connected: false,
                paired: false,
              };
            }

            return device.paired || device.connected ? device : null;
          })
          .map(v => v),
      }));
    } catch (e) {
      alert("Erro ao listar todos os devices: " + e.message);

      this.setState(({ devices }) => ({
        scanning: false,
        devices: devices.filter(device => device.paired || device.connected),
      }));
    }
  };

  /*toggleDevicePairing = async ({ id, paired }) => {
    if (paired) {
      await this.unpairDevice(id);
    } else {
      await this.pairDevice(id);
    }
  };
  */

  /*pairDevice = async id => {
    this.setState({ processing: true });

    try {
      const paired = await BluetoothSerial.pairDevice(id);

      if (paired) {
        alert(
          `Device ${paired.name}<${paired.id}> paired successfully`
        );

        this.setState(({ devices, device }) => ({
          processing: false,
          device: {
            ...device,
            ...paired,
            paired: true,
          },
          devices: devices.map(v => {
            if (v.id === paired.id) {
              return {
                ...v,
                ...paired,
                paired: true,
              };
            }

            return v;
          }),
        }));
      } else {
        alert(`Device <${id}> pairing failed`);
        this.setState({ processing: false });
      }
    } catch (e) {
      alert(e.message);
      this.setState({ processing: false });
    }
  };
  */

  /*unpairDevice = async id => {
    this.setState({ processing: true });

    try {
      const unpaired = await BluetoothSerial.unpairDevice(id);

      if (unpaired) {
        alert(
          `Device ${unpaired.name}<${unpaired.id}> unpaired successfully`
        );

        this.setState(({ devices, device }) => ({
          processing: false,
          device: {
            ...device,
            ...unpaired,
            connected: false,
            paired: false,
          },
          devices: devices.map(v => {
            if (v.id === unpaired.id) {
              return {
                ...v,
                ...unpaired,
                connected: false,
                paired: false,
              };
            }

            return v;
          }),
        }));
      } else {
        alert(`Device <${id}> unpairing failed`);
        this.setState({ processing: false });
      }
    } catch (e) {
      alert(e.message);
      this.setState({ processing: false });
    }
  };
  */

  // DESCONECTAR DISPOSITIVO
  disconnect = async id => {
    
    try {
      await BluetoothSerial.device(id).disconnect();

      this.setState(({ devices, device }) => ({
        processing: false,
        device: {
          ...device,
          connected: false,
        },
        devices: devices.map(v => {
          if (v.id === id) {
            return {
              ...v,
              connected: false,
            };
          }

          return v;
        }),
      }));
    } catch (e) {
      alert(e.message);
      this.setState({ processing: false });
    }
  };

  // ESCREVER MENSAGEM PARA O DISPOSITIVO
  write = async (id, message) => {
    try {
      await BluetoothSerial.device(id).write(message);
      alert("Successfuly wrote to device");
    } catch (e) {
      alert(e.message);
    }
  };

  writePackets = async (id, message, packetSize = 64) => {

    console.log('writePackets')
    try {
      const device = BluetoothSerial.device(id);
      const toWrite = iconv.encode(message, "cp852");
      const writePromises = [];
      const packetCount = Math.ceil(toWrite.length / packetSize);

      for (var i = 0; i < packetCount; i++) {
        const packet = new Buffer(packetSize);
        packet.fill(" ");
        toWrite.copy(packet, 0, i * packetSize, (i + 1) * packetSize);
        writePromises.push(device.write(packet));
      }

      await Promise.all(writePromises).then((res) => {
        //console.log('writePackets')
        //console.log(device)
        //console.log(toWrite)
        //console.log(packetCount)
        console.log(res)
        
        //alert("Writed packets")
      });
    } catch (e) {
      alert(e.message);
    }
  };
  
  render() {

    return (
      <View style={{flex:1}}>

                  <View style={{justifyContent: 'center', alignItems: 'center'}}>
                    <Text style={{ fontSize: 20, margin: 20 }}> LISTA DE DISPOSITIVOS </Text>
                </View>

        {
          this.state.devices.map((dispositivo, index) => {
            return (
                <View key={index} style={{margin: 10, }}>
                  <Text style={{ fontSize: 20, color: "black", paddingRight: 10 }}>
                    {dispositivo.name}
                  </Text>

                  <Text style={{ fontSize: 20, color: "#ccc", paddingRight: 10 }}>
                      {dispositivo.id}
                  </Text>
                </View>
            )
          })
        }
      </View>
    );
  }
}
