import {injectable, /* inject, */ BindingScope} from '@loopback/core';
import {Credenciales, FactorDeAutenticacionPorCodigo, Login, Usuario} from '../models';
import {repository} from '@loopback/repository';
import {LoginRepository, UsuarioRepository} from '../repositories';
import { ConfiguracionSeguridad } from '../config/seguridad.config';
const generate = require('generate-password');
const MD5 = require('crypto-js/md5');
const jwt = require('jsonwebtoken');

@injectable({scope: BindingScope.TRANSIENT})
export class SeguridadUsuarioService {
  constructor(/* Add @inject to inject parameters */
    @repository(UsuarioRepository)
    public repositorioUsuario: UsuarioRepository,

    @repository(LoginRepository)
    public repositorioLogin: LoginRepository,

  ) { }

  /*
   * Add service methods here
   */

  // este metodo crea un texto aleatorio y lo retorna

  crearTexto(n: number): string {
    let texto = generate.generate({
      length: n,
      numbers: true
    });
    return texto;
  }

  // este metodo recibe un texto, lo cifra y lo retorna

  cifrarTexto(cadena: string): string {
    let cifrado = MD5(cadena).toString();
    return cifrado;
  }

  // metodo asincrono que buscar un usuario por correo y clave y lo retorna
  // si lo encuentra o null si no lo encuentra

  async identificarUsuario(credenciales: Credenciales): Promise<Usuario | null> {
    // buscar un usuario por correo y clave
    let usuario = await this.repositorioUsuario.findOne({
      where: {
        correo: credenciales.correo,
        clave: credenciales.clave
      }
    });
    return usuario as Usuario;
  }

 /**
  *
  * @param credenciales2fa credenciales2fa del usuario con el codigo del 2fa
  * @returns el usuario si el codigo2fa es valido o null si no es valido
  */
  async validarCodigo2Fa(credenciales2fa: FactorDeAutenticacionPorCodigo): Promise<Usuario | null> {
    // buscar un login por usuario y codigo2fa con la condicion de que el estadoCodigo2Fa sea false
    let login = await this.repositorioLogin.findOne({
      where: {
        usuarioId: credenciales2fa.usuarioId,
        codigo2Fa: credenciales2fa.codigo2fa,
        estadoCodigo2Fa: false
      }
    });
    if (login) {
      let usuario = await this.repositorioUsuario.findById(login.usuarioId);
      return usuario;
    }
      return null;
  }

  crearToken(usuario: Usuario){
    let datos = {
      name: `${usuario.primerNombre} ${usuario.segundoNombre} ${usuario.primerApellido} ${usuario.segundoApellido}`,
      role: usuario.rolId,
      email: usuario.correo
    }

    let token = jwt.sign(datos, ConfiguracionSeguridad.claveJWT);
    return token;
  }

    /**
     * 
     * @param token el siguiente metodo recibe un token y retorna el rolId usando
     * la clave secreta de la aplicacion
     * @returns retorna un string con el rolId
     */
  obtenerRolId(token: string): string{
    let datos = jwt.verify(token, ConfiguracionSeguridad.claveJWT);
    return datos.role;
  }

}
