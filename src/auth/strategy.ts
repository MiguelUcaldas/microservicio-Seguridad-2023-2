import {AuthenticationBindings, AuthenticationMetadata, AuthenticationStrategy} from '@loopback/authentication';
import {service} from '@loopback/core';
import {HttpErrors, Request} from '@loopback/rest';
import {UserProfile} from '@loopback/security';
import parseBearerToken from 'parse-bearer-token';
import {AuthService, SeguridadUsuarioService} from '../services';
import {inject} from '@loopback/core';
import {repository} from '@loopback/repository';
import {RolMenuRepository} from '../repositories';


export class AuthStrategy implements AuthenticationStrategy {
  name: string = 'auth';

  constructor(
    @service(SeguridadUsuarioService)
    private servicioSeguridad: SeguridadUsuarioService,
    @inject(AuthenticationBindings.METADATA)
    private metadata: AuthenticationMetadata[],
    @repository(RolMenuRepository)
    private rolMenuRepository: RolMenuRepository,
    @service(AuthService)
    private servicioAuth: AuthService
  ) {}

    /**
     * Autentificacion de un usuario frente a una accion en la base de datos
     * @param request la solicitud con el token
     * @returns el perfil del usuario o undefined si no esta autenticado
     */

    

  async authenticate( request: Request): Promise<UserProfile | undefined> {
    //console.log('se ejecuto estrategia');
    let token = parseBearerToken(request);
    if(token){
      let idRol = this.servicioSeguridad.obtenerRolId(token);
      let idMenu: string = this.metadata[0].options![0];
      let accion: string = this.metadata[0].options![1];
      try{
        let res = await this.servicioAuth.verificarPermisoDeUsuarioPorRol(idRol, idMenu, accion);
        return res

      }catch(error){
        throw error;

      }}
      throw new HttpErrors[401]("No es posible ejecutar la accion por falta de token");
    }


    }
