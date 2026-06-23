# Frontend Migration Guide

## Objetivo

Este documento describe el backend actual y sirve como guia para actualizar el proyecto frontend.

La meta es dejar de usar WordPress como almacenamiento principal de datos de la aplicacion y mover esa responsabilidad a este backend en `TypeScript + Express + Prisma`.

WordPress queda solo como proveedor de autenticacion para el login.

## Resumen Ejecutivo

### Nuevo rol de WordPress

WordPress solo se usara para:

- validar credenciales de login
- devolver `license`
- devolver `app_version`

### Nuevo rol de este backend

Este backend sera la fuente principal para:

- usuarios
- consultores
- create names
- notes
- guestenergy
- partner data
- group data

### Regla clave para frontend

El frontend ya no debe tratar `username` como `email`.

`username` en la aplicacion funciona solo como nombre de acceso o identificador de login. No debe usarse como correo real del usuario, ni debe mostrarse en UI como email, ni debe asumirse que tiene formato de correo.

## Arquitectura Actual

Este backend expone una API REST propia y almacena datos en PostgreSQL usando Prisma.

Capas principales:

- `controllers`: reciben requests HTTP y responden JSON
- `services`: aplican validaciones y coordinan logica
- `repositories`: acceden a la base de datos
- `validators`: validan payloads
- `prisma/schema.prisma`: define el modelo de datos

## Flujo Nuevo de Autenticacion

### Antes

El frontend hacia login directamente contra WordPress:

```ts
type LoginCredentialsDTO = {
  username: string;
  password: string;
};

axios.post('/wp-json/app/v3/auth/login', data);
```

### Ahora

El frontend debe hacer login contra este backend:

```ts
type LoginCredentialsDTO = {
  username: string;
  password: string;
};

axios.post('/auth/login', data);
```

### Que hace el backend en `/auth/login`

1. Recibe `username` y `password`.
2. Reenvia esas credenciales a WordPress:

```text
POST {WORDPRESS_API_URL}/wp-json/app/v3/auth/login
```

3. WordPress responde actualmente con algo como:

```json
{
  "license": {
    "id": 2,
    "status": "active",
    "expirationDate": "2028-10-31",
    "licenseId": "425"
  },
  "app_version": "3.0.6"
}
```

4. El backend genera su propio JWT.
5. El backend sincroniza o crea un usuario local minimo para mantener una sesion interna.
6. El backend sincroniza la licencia en PostgreSQL.
7. El backend responde al frontend con datos normalizados para la app.

### Response actual de `/auth/login`

```json
{
  "user": {
    "id": 1,
    "email": "valor-tecnico-interno",
    "firstName": null,
    "lastName": null,
    "scdLastName": null,
    "birthDate": null,
    "country": null,
    "gender": null,
    "phone": null,
    "avatar": null,
    "companyName": null,
    "companyDirection": null,
    "companyPhone": null,
    "companyWebsite": null,
    "companyLogo": null,
    "devices": null,
    "createdAt": "2026-06-22T00:00:00.000Z",
    "updatedAt": "2026-06-22T00:00:00.000Z",
    "license": {
      "id": 2,
      "userId": 1,
      "status": 1,
      "expirationDate": "2028-10-31T00:00:00.000Z",
      "planId": "425"
    }
  },
  "token": "JWT_DEL_BACKEND",
  "license": {
    "id": 2,
    "status": "active",
    "expirationDate": "2028-10-31",
    "licenseId": "425"
  },
  "app_version": "3.0.6"
}
```

## Uso del Token

Despues del login, el frontend debe guardar el `token` y enviarlo en el header:

```http
Authorization: Bearer <token>
```

Este token protege los endpoints internos del backend.

## Endpoint de Sesion

### `POST /auth/login`

Request:

```json
{
  "username": "nombre_de_acceso",
  "password": "secreto"
}
```

Response:

- `user`: usuario local en PostgreSQL para la sesion interna
- `token`: JWT del backend
- `license`: licencia cruda que devuelve WordPress
- `app_version`: version de app que devuelve WordPress

### `GET /auth/me`

Requiere JWT.

Devuelve el usuario autenticado segun el token del backend.

## Regla Importante Sobre WordPress

WordPress ya no debe ser usado por el frontend como fuente principal para guardar o leer entidades del negocio.

WordPress solo se conserva para:

- validar login
- devolver licencia
- devolver `app_version`

## Regla Importante Sobre Datos de Negocio

Los datos de negocio deben empezar a leerse y escribirse en este backend.

Eso incluye:

- usuarios
- consultores
- create names
- notes
- guestenergy
- partner data
- group data

## Endpoints Disponibles en el Backend

Todos estos endpoints requieren `Authorization: Bearer <token>`, salvo `/auth/login`.

### Auth

- `POST /auth/login`
- `GET /auth/me`

### Users

- `GET /users`
- `GET /users/:id`
- `POST /users`
- `PUT /users/:id`

### Consultants

- `GET /consultants`
- `GET /consultants/:id`
- `GET /consultants/user/:userId`
- `POST /consultants`
- `PUT /consultants/:id`
- `DELETE /consultants/:id`

### Create Names

- `POST /create-names/:consultantId`
- `PUT /create-names/:id`
- `GET /create-names/:id`
- `GET /create-names/consultant/:consultantId`

### Partner Data

- `POST /partner-data/:consultantId`
- `POST /partner-data/:partnerDataId/partner`
- `PUT /partner-data/:id`
- `DELETE /partner-data/:id`
- `GET /partner-data/:id`
- `GET /partner-data/consultant/:consultantId`

### Group Data

- `POST /group-data/:consultantId`
- `POST /group-data/:groupDataId/member`
- `PUT /group-data/:id`
- `DELETE /group-data/:id`
- `GET /group-data/:id`
- `GET /group-data/consultant/:consultantId`

### Notes

No hay endpoints dedicados todavia.

Estado actual:

- las notas existen en el modelo `ConsultantNote`
- cuando el frontend pide `GET /consultants/:id` o `GET /consultants/user/:userId`, las notas vienen incluidas dentro del consultor

### GuestEnergy

No hay endpoints dedicados publicados todavia.

Estado actual en modelo:

- `Guest`
- `GuestPartner`
- `GuestGroupMember`

Existe una implementacion parcial en repository, pero aun no hay controller ni rutas expuestas para frontend.

## Flujos de Datos

### Flujo de Login

1. El usuario captura `username` y `password`.
2. El frontend llama `POST /auth/login`.
3. El backend valida el login contra WordPress.
4. WordPress devuelve `license` y `app_version`.
5. El backend genera `token`.
6. El frontend guarda:

- `token`
- `user`
- `license`
- `app_version`

7. El frontend usa `token` en todas las llamadas siguientes.

### Flujo de Sesion Persistente

1. Al iniciar la app, el frontend revisa si existe `token`.
2. Si existe, llama `GET /auth/me`.
3. Si responde `200`, mantiene la sesion.
4. Si responde `401`, limpia estado local y redirige a login.

### Flujo de Datos de Negocio

1. El frontend obtiene el `token`.
2. Usa este backend como API principal.
3. Crea, lee, actualiza o elimina datos de negocio aqui.
4. WordPress ya no participa en estos CRUDs.

## Logica y Flujo de los Controladores

## Users

### Objetivo

Gestionar el perfil base del usuario almacenado localmente.

### Endpoints

- `GET /users`
- `GET /users/:id`
- `POST /users`
- `PUT /users/:id`

### Flujo de `POST /users`

1. El frontend envia datos del usuario.
2. El controlador valida que exista body.
3. Convierte `birthDate` a ISO si viene presente.
4. El service valida campos requeridos.
5. El repository crea el usuario en PostgreSQL.
6. El backend responde con el usuario creado.

### Flujo de `PUT /users/:id`

1. El frontend envia `id` y body.
2. El controlador valida `id` y body.
3. Convierte `birthDate` a ISO si aplica.
4. El service valida.
5. El repository actualiza el usuario.
6. El backend responde con el usuario actualizado.

### Uso recomendado en frontend

Usar este modulo para datos de perfil local, no para login.

## Consultants

### Objetivo

Gestionar consultores asociados a un usuario.

### Endpoints

- `GET /consultants`
- `GET /consultants/:id`
- `GET /consultants/user/:userId`
- `POST /consultants`
- `PUT /consultants/:id`
- `DELETE /consultants/:id`

### Flujo de `POST /consultants`

1. El frontend envia datos del consultor.
2. El controlador valida body.
3. Si no viene `id`, genera uno automatico.
4. Convierte `date` a ISO si viene presente.
5. El service valida campos importantes.
6. El repository crea el consultor.
7. El backend responde con el consultor creado.

### Flujo de `GET /consultants/user/:userId`

1. El frontend envia `userId`.
2. El backend busca todos los consultores de ese usuario.
3. La respuesta incluye relaciones importantes del consultor:

- `notes`
- `partners`
- `createNames`
- `partnerData`
- `groupData`

### Uso recomendado en frontend

Este endpoint debe ser el pivote principal para construir las vistas detalladas de un consultor.

## Create Names

### Objetivo

Gestionar nombres creados asociados a un consultor.

### Endpoints

- `POST /create-names/:consultantId`
- `PUT /create-names/:id`
- `GET /create-names/:id`
- `GET /create-names/consultant/:consultantId`

### Flujo de `POST /create-names/:consultantId`

1. El frontend envia `consultantId` y payload.
2. El controlador valida `consultantId`.
3. Genera `id` automaticamente.
4. Inyecta `consultantId` en el objeto.
5. El service valida reglas de persona y fecha.
6. El repository crea el registro.
7. El backend responde con el item creado.

### Uso recomendado en frontend

Usarlo como subrecurso de consultor. No manejarlo como entidad independiente de primer nivel en UI.

## Notes

### Objetivo

Representar notas asociadas a un consultor.

### Modelo actual

Cada nota tiene:

- `consultantId`
- `dateKey`
- `pathKey`
- `value`

Ademas existe una restriccion unica por:

- `consultantId`
- `dateKey`
- `pathKey`

Eso significa que para una misma ruta logica dentro de un consultor solo puede existir una nota por combinacion de fecha y path.

### Flujo actual de datos

1. El frontend consulta un consultor con:

- `GET /consultants/:id`
- o `GET /consultants/user/:userId`

2. El backend responde incluyendo `notes` dentro del objeto consultor.
3. El frontend debe consumir esas notas como parte del agregado `consultant`, no como recurso independiente.

### Logica recomendada para frontend

- tratar `notes` como una coleccion anidada del consultor
- no asumir por ahora un CRUD independiente de notas
- si una pantalla necesita editar notas, hay que considerar que el backend todavia no publica endpoints dedicados para eso

### Implicacion de migracion

El frontend puede empezar a leer notas desde este backend como parte del consultor, pero para escritura de notas todavia hace falta completar endpoints especificos o una estrategia de actualizacion del consultor/notas.

## Partner Data

### Objetivo

Gestionar datos de pareja asociados a un consultor y sus partners hijos.

### Endpoints

- `POST /partner-data/:consultantId`
- `POST /partner-data/:partnerDataId/partner`
- `PUT /partner-data/:id`
- `DELETE /partner-data/:id`
- `GET /partner-data/:id`
- `GET /partner-data/consultant/:consultantId`

### Flujo de `POST /partner-data/:consultantId`

1. El frontend envia `consultantId` y payload principal.
2. El controlador valida `consultantId`.
3. Genera `id`.
4. Inyecta `consultantId`.
5. El service valida.
6. El repository crea el registro padre.
7. El backend responde con el `partnerData` creado.

### Flujo de `POST /partner-data/:partnerDataId/partner`

1. El frontend envia `partnerDataId` y datos del partner.
2. El controlador valida `partnerDataId`.
3. Genera `id`.
4. El service valida los datos del partner.
5. El repository crea el partner hijo conectado al padre.
6. El backend responde con el partner creado.

### Uso recomendado en frontend

Separar visualmente:

- entidad padre `partnerData`
- lista hija de partners

El frontend no debe asumir que ambos se crean en un solo request.

## Group Data

### Objetivo

Gestionar grupos asociados a un consultor y sus miembros.

### Endpoints

- `POST /group-data/:consultantId`
- `POST /group-data/:groupDataId/member`
- `PUT /group-data/:id`
- `DELETE /group-data/:id`
- `GET /group-data/:id`
- `GET /group-data/consultant/:consultantId`

### Flujo de `POST /group-data/:consultantId`

1. El frontend envia `consultantId` y payload principal.
2. El controlador valida `consultantId`.
3. Genera `id`.
4. Inyecta `consultantId`.
5. El service valida campos requeridos.
6. El repository crea el grupo padre.
7. El backend responde con el grupo creado.

### Flujo de `POST /group-data/:groupDataId/member`

1. El frontend envia `groupDataId` y datos del miembro.
2. El controlador valida `groupDataId`.
3. Genera `id`.
4. El service valida al miembro.
5. El repository crea el miembro hijo conectado al grupo.
6. El backend responde con el miembro creado.

### Uso recomendado en frontend

Separar visualmente:

- entidad padre `groupData`
- lista hija de miembros

El frontend no debe asumir que ambos se crean en un solo request.

## GuestEnergy

### Objetivo

Representar la informacion de invitado asociada a un usuario y sus relaciones:

- datos base de guest
- pareja invitada
- miembros de grupo invitado

### Modelo actual

El modulo `guestenergy` en la base hoy se distribuye asi:

### `Guest`

- relacionado 1 a 1 con `User`
- campos:
  - `userId`
  - `partnerName`
  - `partnerMeetYear`
  - `groupName`
  - `groupYear`

### `GuestPartner`

- hijos de `Guest`
- campos:
  - `guestId`
  - `names`
  - `lastName`
  - `scdLastName`
  - `date`

### `GuestGroupMember`

- hijos de `Guest`
- campos:
  - `guestId`
  - `name`
  - `lastName`
  - `scdLastName`
  - `date`
  - `dateInit`

### Estado actual del backend

Hay repository para `guestenergy`, pero aun no existen:

- service publico
- controller publico
- rutas expuestas para frontend

### Flujo actual de datos

Hoy frontend no tiene un flujo REST formal para `guestenergy` desde este backend.

Eso significa:

- los datos existen en modelo y repository
- aun no existe contrato HTTP estable para consumirlos desde frontend

### Flujo objetivo recomendado

Cuando se exponga formalmente, el flujo recomendado deberia ser:

1. resolver el usuario autenticado o usuario objetivo
2. consultar el recurso `guest` asociado a `userId`
3. leer dentro del mismo flujo:

- datos base de guest
- partners invitados
- miembros de grupo invitados

4. manejar `guestenergy` como agregado asociado al usuario, no como recurso aislado

### Recomendacion para frontend

No migrar aun una pantalla completa de `guestenergy` suponiendo endpoints definitivos hasta que se publiquen controllers y rutas de este modulo.

Lo correcto es considerar `guestenergy` como:

- modulo existente en datos
- modulo no finalizado aun en API publica

## Flujo Recomendado en Frontend

### 1. Login

- llamar `POST /auth/login`
- guardar `token`
- guardar `user`
- guardar `license`
- guardar `app_version`

### 2. Sesion persistente

- si existe token, llamar `GET /auth/me`
- si responde `401`, limpiar sesion local

### 3. Datos de negocio

- dejar de leer estos datos desde WordPress
- leerlos desde este backend usando el token

### 4. Consultor como agregado principal

En muchas pantallas conviene usar este flujo:

1. cargar usuario
2. cargar consultores por `userId`
3. para cada consultor, trabajar sus submodulos:

- `notes`
- `createNames`
- `partnerData`
- `groupData`

### 5. GuestEnergy como agregado del usuario

Para las pantallas de invitado, el flujo objetivo debe ser:

1. cargar usuario
2. resolver `guestenergy` por `userId`
3. trabajar los subdatos:

- guest base
- guest partners
- guest group members

Hoy este flujo todavia no esta completamente publicado como API HTTP.

## Mapeo de Licencia

El backend convierte el estado de licencia de WordPress a la forma actual de la base local:

- `active` -> `1`
- `inactive` -> `0`
- `expired` -> `0`

Ademas:

- `license.licenseId` de WordPress se guarda en `licenses.planId`
- `license.expirationDate` se guarda en `licenses.expirationDate`

## Limitaciones Actuales

Hay varios puntos que el frontend debe tener en cuenta en esta etapa:

- WordPress no devuelve perfil completo del usuario en el login.
- `username` no representa email real.
- el frontend no debe renderizar `username` como correo.
- hoy el backend mantiene un usuario local minimo para sostener la sesion y relacionar datos internos.
- `licenseId` de WordPress hoy se guarda en `planId` porque el esquema actual no tiene una columna propia llamada `licenseId`.
- `notes` solo estan disponibles de forma anidada dentro del consultor.
- `guestenergy` existe en modelo y repository, pero aun no tiene endpoints publicos terminados.

## Recomendaciones Para La Migracion del Frontend

### Cambios minimos obligatorios

- reemplazar `POST /wp-json/app/v3/auth/login` por `POST /auth/login`
- guardar y reenviar el JWT del backend
- mover las lecturas y escrituras de entidades al backend nuevo
- dejar de depender de WordPress para CRUDs de negocio

### Cambios recomendados

- centralizar el token en un `auth store`
- crear un `axios interceptor` para agregar `Authorization`
- manejar `401` para cerrar sesion
- tratar `license` y `app_version` como datos que vienen del login del backend, no directo de WordPress
- no usar el campo `email` del usuario local como fuente de verdad para UI de identidad si la app opera con `username`

## Ejemplo de Cliente Axios

```ts
import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:3000',
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
```

## Ejemplo de Login en Frontend

```ts
type LoginCredentialsDTO = {
  username: string;
  password: string;
};

type LoginResponse = {
  user: {
    id: number;
    email: string;
  };
  token: string;
  license: {
    id: number;
    status: string;
    expirationDate: string;
    licenseId: string;
  } | null;
  app_version: string | null;
};

const login = async (data: LoginCredentialsDTO) => {
  const response = await api.post<LoginResponse>('/auth/login', data);
  return response.data;
};
```

## Recomendacion Tecnica Importante

Como `username` no es email, el frontend deberia desacoplar claramente estos conceptos:

- `username`: credencial de acceso
- `email`: dato de perfil si existe realmente

No deben compartirse como si fueran el mismo valor.

## Siguiente Paso Recomendado

Usar este documento como guia para:

1. cambiar el modulo de login del frontend
2. agregar soporte de JWT del backend
3. migrar cada lectura y escritura de WordPress hacia endpoints de este backend
4. reorganizar las vistas del frontend alrededor de `consultant` como entidad principal y sus subrecursos
5. planificar la exposicion formal de `notes` y `guestenergy` donde aun no exista contrato HTTP suficiente

Si el frontend aun depende de otros endpoints de WordPress ademas del login, conviene documentarlos uno por uno y reemplazarlos por rutas equivalentes de este backend.
