import {injectable, /* inject, */ BindingScope} from '@loopback/core';
import {repository} from '@loopback/repository';
import {RolMenuRepository} from '../repositories';
import {HttpErrors} from '@loopback/rest';
import {UserProfile} from '@loopback/security';

@injectable({scope: BindingScope.TRANSIENT})
export class AuthService {
  constructor(@repository(RolMenuRepository)
  private rolMenuRepository : RolMenuRepository) {}

 async verificarPermisoDeUsuarioPorRol(idRol: string, idMenu: string, accion: string):Promise<UserProfile | undefined> {

      let permiso = await this.rolMenuRepository.findOne({
        where: {
          rolId: idRol,
          menuId: idMenu
                }
                                                         })
      let continuar: boolean = false;
      if(permiso){
        switch (accion) {
          case "guardar":
            continuar = permiso.guardar;
            break;
          case "listar":
            continuar = permiso.listar;
            break;
          case "editar":
            continuar = permiso.editar;
            break;
          case "eliminar":
            continuar = permiso.eliminar;
            break;
          case "descargar":
            continuar = permiso.descargar;
            break;
          default:
            throw new HttpErrors[401]("No Existe la accion");
        }
        if(continuar){
        let perfil: UserProfile = Object.assign({
          permitido: "ok"
        });
        return perfil;
       }
      else{
        throw new HttpErrors[401]("No es posible ejecutar por falta de permisos");

      }}}

}
