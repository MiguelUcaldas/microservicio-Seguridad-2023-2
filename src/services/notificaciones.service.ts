import {injectable, /* inject, */ BindingScope} from '@loopback/core';
import {ConfiguracionSeguridad} from '../config/seguridad.config';
import {HttpErrors} from '@loopback/rest';


const fetch = require('node-fetch');
//instalacion npm install node-fetch@2.6.7

@injectable({scope: BindingScope.TRANSIENT})
export class NotificacionesService {
  constructor(/* Add @inject to inject parameters */) {}

  async enviarEmail(mensaje:string, usuario: string, correo: string, asunto:string){
    const datos = { mensaje: mensaje, usuario: usuario , correo: correo, asunto: asunto};
    const enviarEmail = `${ConfiguracionSeguridad.enviarMensaje}/sendemail`;
    let respuesta = undefined;
  //  console.log(enviarEmail)
   // console.log(datos)
    try{
    await fetch(enviarEmail, {
              method: 'post',
              body:    JSON.stringify(datos),
              headers: { 'Content-Type': 'application/json' },
          })
          .then((res:any) => res.json())
          .then((json:any) => { respuesta = json; });
          return  console.log(respuesta);
    } catch(error){
      throw new HttpErrors[401]("No se pudo enviar el Email");
    }
  }

  //metodo asincrono que recibe un codigo de verificacion y un usuario y crea un objeto json
  //para enviarlo a una direccion url con fetch via SmS /sendsms
  async enviarSms(codigo:string, usuario: string, telefono: string ){
    const datos = { codigo: codigo, usuario: usuario , telefono: telefono };
    const enviarSms = `${ConfiguracionSeguridad.enviarMensaje}/sendsms`;
    let respuesta = undefined;
    console.log(enviarSms)
    try{
    await fetch(enviarSms, {
              method: 'post',
              body:    JSON.stringify(datos),
              headers: { 'Content-Type': 'application/json' },
          })
          .then((res:any) => res.json())
          .then((json:any) => { respuesta = json; });
          return console.log(respuesta);
    } catch(error){
      throw new HttpErrors[401]("No se pudo enviar el SmS");

    }
  }

  //metodo que envia el microservicio de notificaciones el usuario verificado
  // con las variables de primer nombre, segundo nombre, primer apellido, segundo apellido
  // correo y telefono
  async enviarUsuarioVerificado( primerNombre: string, segundoNombre: string, primerApellido: string, segundoApellido: string, correo: string, telefono: string ){
    const datos = {  primerNombre: primerNombre , segundoNombre: segundoNombre, primerApellido: primerApellido, segundoApellido: segundoApellido, correo: correo, telefono: telefono , bloqueo: false};
    const enviarUsuarioVerificado = `${ConfiguracionSeguridad.conexionMicroservicioLogicadenegocios}/clientes-publico`;
    let respuesta = undefined;
    console.log(enviarUsuarioVerificado)
    try{
    await fetch(enviarUsuarioVerificado, {
              method: 'post',
              body:    JSON.stringify(datos),
              headers: { 'Content-Type': 'application/json' },
          })
          .then((res:any) => res.json())
          .then((json:any) => { respuesta = json; });
          return  console.log(respuesta);
    } catch(error){
      throw new HttpErrors[401]("No se pudo enviar el usuario verificado");

    }
  }

  //mismo metodo que el anterior pero apuntado a crear un conductor
  async enviarConductorVerificado( primerNombre: string, segundoNombre: string, primerApellido: string, segundoApellido: string, correo: string, telefono: string ){
    const datos = {primerNombre: primerNombre , segundoNombre: segundoNombre, primerApellido: primerApellido, segundoApellido: segundoApellido, bloqueo: false, correo: correo, telefono: telefono ,  disponible: true};
    const enviarConductorVerificado = `${ConfiguracionSeguridad.conexionMicroservicioLogicadenegocios}/conductores-publico`;
    let respuesta = undefined;
    console.log(enviarConductorVerificado)
    try{
    await fetch(enviarConductorVerificado, {
              method: 'post',
              body:    JSON.stringify(datos),
              headers: { 'Content-Type': 'application/json' },
          })
          .then((res:any) => res.json())
          .then((json:any) => { respuesta = json; });
          return  console.log(respuesta);
    } catch(error){
      throw new HttpErrors[401]("No se pudo enviar el conductor verificado");

    }
  }




}
