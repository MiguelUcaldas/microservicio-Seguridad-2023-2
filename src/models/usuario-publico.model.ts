import {Model, model, property} from '@loopback/repository';

@model()
export class UsuarioPublico extends Model {
  @property({
    type: 'string',
    required: true,
  })
  primeroNombre: string;

  @property({
    type: 'string',
  })
  segundoNombre?: string;

  @property({
    type: 'string',
    required: true,
  })
  primeroApellido: string;

  @property({
    type: 'string',
  })
  segundoApellido?: string;

  @property({
    type: 'string',
    required: true,
  })
  correo: string;

  @property({
    type: 'string',
    required: true,
  })
  celular: string;

  @property({
    type: 'string',
    required: true,
  })
  tipoUsuario: string;


  constructor(data?: Partial<UsuarioPublico>) {
    super(data);
  }
}

export interface UsuarioPublicoRelations {
  // describe navigational properties here
}

export type UsuarioPublicoWithRelations = UsuarioPublico & UsuarioPublicoRelations;
