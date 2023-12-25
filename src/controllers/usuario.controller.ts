import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where,
} from '@loopback/repository';
import {
  post,
  param,
  get,
  getModelSchemaRef,
  patch,
  put,
  del,
  requestBody,
  response,
  HttpErrors,
} from '@loopback/rest';
import {Credenciales, FactorDeAutenticacionPorCodigo, Login, PermisosRolMenu, Usuario, UsuarioPublico} from '../models';
import {LoginRepository, UsuarioRepository} from '../repositories';
import {service} from '@loopback/core';
import {AuthService, NotificacionesService, SeguridadUsuarioService} from '../services';
import {authenticate} from '@loopback/authentication';
import {ConfiguracionSeguridad} from '../config/seguridad.config';
import {UserProfile} from '@loopback/security';

export class UsuarioController {
  constructor(
    @repository(UsuarioRepository)
    public usuarioRepository : UsuarioRepository,
    @service(SeguridadUsuarioService)
    public servicioSeguridad: SeguridadUsuarioService,
    @repository(LoginRepository)
    public loginRepository: LoginRepository,
    @service(AuthService)
    public servicioAuth: AuthService,
    @service(NotificacionesService)
    public servicioNotificaciones: NotificacionesService,
  ) {}

  @authenticate({
    strategy : 'auth',
    options: [ConfiguracionSeguridad.menuUsuarioId,ConfiguracionSeguridad.guardarAccion]
 })
  @post('/usuarios')
  @response(200, {
    description: 'Usuario model instance',
    content: {'application/json': {schema: getModelSchemaRef(Usuario)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Usuario, {
            title: 'NewUsuario',
            exclude: ['_id'],
          }),
        },
      },
    })
    usuario: Omit<Usuario, '_id'>,
  ): Promise<Usuario> {
    // cerar la clave
    let clave = this.servicioSeguridad.crearTexto(10);
    // cifrar la clave
    let claveCifrada = this.servicioSeguridad.cifrarTexto(clave);
    // asignar la clave cifrada al usuario
    usuario.clave = claveCifrada;
    // guardar el usuario
    return this.usuarioRepository.create(usuario);
  }

  @post('/usuarios-publico')
  @response(200, {
    description: 'Usuario model instance',
    content: {'application/json': {schema: getModelSchemaRef(Usuario)}},
  })
  async crearUsuarioPublic(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(UsuarioPublico, {}),
        },
      },
    })
    usuarioP: UsuarioPublico,
  ): Promise<Usuario> {

    let tipoUserCorreo = "Cliente"

    //se crea un objeto de tipo usuario para crear un usuario en la base de datos
    let usuario: Usuario = new Usuario();
    // cerar la clave
    let clave = this.servicioSeguridad.crearTexto(10);
    // cifrar la clave
    let claveCifrada = this.servicioSeguridad.cifrarTexto(clave);
    // asignar la clave cifrada al usuario
    usuario.clave = claveCifrada;
    //hash de validacion de correo

    usuario.primerNombre = usuarioP.primeroNombre;
    usuario.segundoNombre = usuarioP.segundoNombre;
    usuario.primerApellido = usuarioP.primeroApellido;
    usuario.segundoApellido = usuarioP.segundoApellido;
    usuario.correo = usuarioP.correo;

    let codigoHash = this.servicioSeguridad.crearTexto(100);
    usuario.codigoHash = codigoHash;
    usuario.EstadocodigoHash = false;
    usuario.celular = usuarioP.celular;
    usuario.correo = usuarioP.correo;

    if(usuarioP.tipoUsuario == "Conductor" || usuarioP.tipoUsuario == "conductor"){
      usuario.rolId = "65648e31cca56e0da0b21837";
      tipoUserCorreo = "Conductor";
    }else{
      usuario.rolId = "65648e1ccca56e0da0b21836";
    }

    console.log(usuario);

    // se crea el usuario
    this.usuarioRepository.create(usuario);


    // enviar el correo con el codigo hash
    let mensaje = `<h1> Bienvenido a la plataforma </h1>
    <p> Para validar el correo haga click en el siguiente enlace </p>
    <p> Su tipo de usuario es: ${tipoUserCorreo} </p>
    <a href="http://[::1]:3000/usuario/verificar-correo/${codigoHash}"> Click aqui </a>
    <p> Su clave es: ${clave} </p>
    `;

    let asunto = "Validacion de correo";

    // enviar el correo
    await this.servicioNotificaciones.enviarEmail(mensaje, usuario.primerNombre, usuario.correo, asunto);



   try{
    console.log("Se creo el usuario");
    return usuario;

  } // guardar el usuario
   catch(error){
      console.log(error);
      throw new HttpErrors[401]("Error en la creacion del usuario");
   }

  }

@get('/usuario/verificar-correo/{codigoHash}')
async verificarCorreo(
  @param.query.string('codigoHash') codigoHash: string,
): Promise<string> {
  // Validar el código hash y activar el usuario
  let usuario = await this.usuarioRepository.findOne({
    where: {
      codigoHash: codigoHash,
      EstadocodigoHash: false,
    },
  });

  if (!usuario) {
    throw new HttpErrors.NotFound('Usuario no encontrado o ya activado');
  }

  // Realizar las operaciones adicionales necesarias para activar el usuario
  usuario.EstadocodigoHash = true;
  await this.usuarioRepository.update(usuario);

  if(usuario.rolId == "65648e1ccca56e0da0b21836"){
    console.log("Se envio el correo cliente");
    console.log(usuario);

    this.servicioNotificaciones.enviarUsuarioVerificado(usuario.primerNombre, usuario.segundoNombre!, usuario.primerApellido, usuario.segundoApellido!, usuario.correo, usuario.celular);
  }
  if(usuario.rolId == "65648e31cca56e0da0b21837"){
    console.log("Se envio el correo conductor");
    console.log(usuario);
    this.servicioNotificaciones.enviarConductorVerificado(usuario.primerNombre, usuario.segundoNombre!, usuario.primerApellido, usuario.segundoApellido!, usuario.correo, usuario.celular);
  }

 this.servicioNotificaciones.enviarEmail("Su cuenta ha sido activada", usuario.primerNombre, usuario.correo, "Cuenta activada");


  return "usuario activado";
}

  @get('/usuarios/count')
  @response(200, {
    description: 'Usuario model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(Usuario) where?: Where<Usuario>,
  ): Promise<Count> {
    return this.usuarioRepository.count(where);
  }


/*
Implementacion de la estrategia de autentificacion
*/
@authenticate({
   strategy : 'auth',
   options: [ConfiguracionSeguridad.menuUsuarioId,ConfiguracionSeguridad.listarAccion]
})
  @get('/usuarios')
  @response(200, {
    description: 'Array of Usuario model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Usuario, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(Usuario) filter?: Filter<Usuario>,
  ): Promise<Usuario[]> {
    return this.usuarioRepository.find(filter);
  }

  @patch('/usuarios')
  @response(200, {
    description: 'Usuario PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Usuario, {partial: true}),
        },
      },
    })
    usuario: Usuario,
    @param.where(Usuario) where?: Where<Usuario>,
  ): Promise<Count> {
    return this.usuarioRepository.updateAll(usuario, where);
  }

  @get('/usuarios/{id}')
  @response(200, {
    description: 'Usuario model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Usuario, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(Usuario, {exclude: 'where'}) filter?: FilterExcludingWhere<Usuario>
  ): Promise<Usuario> {
    return this.usuarioRepository.findById(id, filter);
  }

  @patch('/usuarios/{id}')
  @response(204, {
    description: 'Usuario PATCH success',
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Usuario, {partial: true}),
        },
      },
    })
    usuario: Usuario,
  ): Promise<void> {
    await this.usuarioRepository.updateById(id, usuario);
  }

  @put('/usuarios/{id}')
  @response(204, {
    description: 'Usuario PUT success',
  })
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() usuario: Usuario,
  ): Promise<void> {
    await this.usuarioRepository.replaceById(id, usuario);
  }

  @del('/usuarios/{id}')
  @response(204, {
    description: 'Usuario DELETE success',
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.usuarioRepository.deleteById(id);
  }

/** Metodos personalizados para la Api */

@post('/identificar/usuario')
@response(200, {
  description: "identificar usuario por correo y clave",
  content: {'application/json': {schema: getModelSchemaRef(Usuario)}},
})

async identificarUsuario(
  @requestBody(
    {
    content: {
      'application/json': {
        schema: getModelSchemaRef(Credenciales)
      }
    }
  }
)
  credenciales : Credenciales
  // la promesa retorna un objeto
): Promise<object> {
  // se usa await porque el metodo identificarUsuario es asincrono y retorna una promesa
  let usuario = await this.servicioSeguridad.identificarUsuario(credenciales);
  // el metodo identificarUsuario retorna un usuario o null si es null no se encontro el usuario
  // por lo tanto el inicio de seccion no es valido
  if(usuario){

    let codigo2fa = this.servicioSeguridad.crearTexto(5);

    let login:Login = new Login();
    login.usuarioId = usuario._id!;
     // el signo de admiracion es para decirle a typescript que no es null
    login.codigo2Fa = codigo2fa;
    login.estadoCodigo2Fa = false;
    // el estado es falso porque el codigo no se ha enviado ni utilizado
    login.token = "";
    // el token se genera cuando el usuario se loguea pero no se deja null porque el modelo se lo exige
    login.estadoToken = false;
    // el estado es falso porque el token no se ha enviado ni utilizado
    this.loginRepository.create(login);
    // se crea el login
    usuario.clave = "";
    // la clave se pone en blanco para no exponerla
    return usuario;
}
  // si las credenciales no son validas es decir el correo y la clave no son de un usuario registrado
  // se retorna un error
  return new HttpErrors[401]("Las credenciales no son correctas");
}

// Metodo verificar 2fa

@post('/verificar-fa')
@response(200, {
  description: "validar un codigo de 2fa",
  content: {'application/json': {schema: getModelSchemaRef(FactorDeAutenticacionPorCodigo)}},
})

async VerificarCodigo2fa(
  @requestBody(
    {
    content: {
      'application/json': {
        schema: getModelSchemaRef(FactorDeAutenticacionPorCodigo)
      }
    }
  }
)
  credenciales2fa : FactorDeAutenticacionPorCodigo
  // la promesa retorna un objeto
): Promise<object> {

  let usuario = await this.servicioSeguridad.validarCodigo2Fa(credenciales2fa);
  /**
   * si el usuario es valido crear un token sobre la informacion del usuario
   * cambiar la clave del usuario por vacio para no exponerla al enviar informacion
   */
  if(usuario){
    // si el usuario es valido crear un token sobre la informacion del usuario
    let token = this.servicioSeguridad.crearToken(usuario);
    // cambiar la clave del usuario por vacio para no exponerla al enviar informacion
    usuario.clave = " ";
    // retornar el usuario y el token

    /**
     *A continuacion se usa el try para mediante la relacion logins que esta entre
     usuario y login se actualice el estado del codigo 2fa a true donde el estadoCodigo2Fa
      sea false y despues usar un cath en caso de que no se actualice el estado del codigo 2fa
      OJO el estado del codigo se cambia para todas las instancias de login que tenga el usuario
      y que esten en estado false
     */
    try   {
    this.usuarioRepository.logins(usuario._id).patch(
      {
        // se le cambio el estado del codigo 2fa a true
        estadoCodigo2Fa: true,
        // ahora se asigna el token al login
        token: token

      },
      {
        estadoCodigo2Fa: false
      });
          }
    catch {
      console.log("No se ha actualizado el estado del codigo 2fa en la base de datos");
          }


    /**
     * habiendo confirmado el codigo 2fa y creado el token se procede a actualizar el estado del token
     * y habiendo actualizado el estado en la base de datos se procede a retornar el usuario y el token
     * en caso de que no se actualice el estado del token se retorna un error
     */

    return {
      user: {usuario},
      token
    }

  }

  return new HttpErrors[401]("Codigo de 2fa no valido");
}


@post('/validar/permisos')
@response(200, {
  description: "validacion de permisos de usuario para logica de negocio",
  content: {'application/json': {schema: getModelSchemaRef(PermisosRolMenu)}},
})

async validadPermisosDeUsuario(
  @requestBody(
    {
    content: {
      'application/json': {
        schema: getModelSchemaRef(PermisosRolMenu)
      }
    }
  }
)
  datos : PermisosRolMenu
  // la promesa retorna un objeto
): Promise<UserProfile | undefined> {
  let idRol = this.servicioSeguridad.obtenerRolId(datos.token);
  console.log("Se valido permiso");
 return await this.servicioAuth.verificarPermisoDeUsuarioPorRol(idRol, datos.idMenu, datos.accion);


}// end


}
