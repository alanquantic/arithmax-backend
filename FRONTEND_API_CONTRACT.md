# Frontend API Contract

Este documento describe el contrato tecnico actual del backend, en el orden solicitado por el equipo frontend.

Importante:

- refleja el estado real actual del backend
- cuando un contrato HTTP aun no es ideal, aqui se documenta el comportamiento real
- `username` no es `email`

## 1. Contrato de autenticacion

## `POST /auth/login`

### Request real

```json
{
  "username": "nombre_de_acceso",
  "password": "secreto"
}
```

### Validacion actual

- `username` es requerido
- `password` es requerido
- `username` no debe asumirse como email

Referencia:

- [authValidator.ts](C:/Users/andre/Documents/cursor/backend-sf-nume-v3/src/validators/authValidator.ts)

### Flujo real

1. El backend recibe `username` y `password`.
2. Llama a WordPress:

```text
POST {WORDPRESS_API_URL}/wp-json/app/v3/auth/login
```

3. WordPress responde actualmente con:

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

4. El backend:

- genera JWT propio
- crea o actualiza un usuario local minimo
- sincroniza licencia local

### Response real actual

```json
{
  "user": {
    "id": 1,
    "email": "nombre_de_acceso",
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
    "createdAt": "2026-06-23T00:00:00.000Z",
    "updatedAt": "2026-06-23T00:00:00.000Z",
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

### Observacion funcional importante

Hoy el backend usa `username` para poblar el campo tecnico local `email` del usuario interno. Eso no significa que el valor sea un correo real.

Frontend no debe asumir:

- que `user.email` sea correo real
- que `username === email`

## `GET /auth/me`

### Request real

Sin body.

Requiere:

```http
Authorization: Bearer <token>
```

### Response real actual

```json
{
  "id": 1,
  "email": "nombre_de_acceso",
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
  "createdAt": "2026-06-23T00:00:00.000Z",
  "updatedAt": "2026-06-23T00:00:00.000Z"
}
```

Nota:

- `GET /auth/me` hoy no incluye `license`

## Formato del JWT

Se firma con:

- `JWT_SECRET`
- expiracion `7d`

Payload actual:

```json
{
  "userId": 1,
  "email": "nombre_de_acceso"
}
```

## Como debe enviarse

En rutas protegidas:

```http
Authorization: Bearer <token>
```

## Status codes actuales

### 200

- lecturas exitosas
- updates exitosos
- deletes exitosos
- login exitoso

### 201

- creacion exitosa

### 400

Se usa cuando el controller detecta:

- falta de `id`
- falta de parametros requeridos
- body vacio

Tambien existe `ValidationError` con `statusCode = 400`.

### 401

Se usa en auth middleware cuando:

- falta `Authorization`
- token invalido
- token expirado

Respuestas actuales:

```json
{
  "message": "Token de autenticacion requerido"
}
```

o

```json
{
  "message": "Token invalido o expirado"
}
```

### 403

No hay uso explicito actual.

### 404

Existe a nivel `NotFoundError`, pero varios controllers hoy responden `500` generico en vez de propagar `404` HTTP real.

### 422

Existe `BusinessLogicError`, pero no tiene uso principal hoy en estos modulos.

### 500

Es el status mas frecuente cuando algo falla en controllers actuales.

## 2. Contrato de entidades principales

## Consultant

```ts
type Consultant = {
  id: string;
  userId: number;
  company: string | null;
  date: string | null;
  email: string | null;
  gender: string | null;
  lastName: string | null;
  names: string | null;
  nationality: string | null;
  phone: string | null;
  scdLastName: string | null;
  group: unknown | null;
};
```

Relaciones posibles:

- `user`
- `notes`
- `partners`
- `createNames`
- `partnerData`
- `groupData`

## CreateName

```ts
type CreateName = {
  id: string;
  consultantId: string;
  name: string | null;
  lastName: string | null;
  scdLastName: string | null;
  birthDate: string | null;
  isPerson: boolean | null;
};
```

## PartnerData

```ts
type PartnerData = {
  id: string;
  consultantId: string;
  name: string | null;
  date: string | null;
  yearMeet: number | null;
};
```

## Partner

```ts
type Partner = {
  id: string;
  partnerDataId: string;
  names: string | null;
  lastName: string | null;
  scdLastName: string | null;
  date: string | null;
};
```

## GroupData

```ts
type GroupData = {
  id: string;
  consultantId: string;
  name: string | null;
  description: string | null;
  date: string | null;
  lastInit: number | null;
};
```

## GroupMember

```ts
type GroupMember = {
  id: string;
  groupDataId: string;
  name: string | null;
  lastName: string | null;
  scdLastName: string | null;
  date: string | null;
  dateInit: number | null;
};
```

## Notes

```ts
type Note = {
  id: number;
  consultantId: string;
  dateKey: string;
  pathKey: string;
  value: string | null;
};
```

Restriccion unica real:

- `consultantId`
- `dateKey`
- `pathKey`

## Guest

```ts
type Guest = {
  id: number;
  userId: number;
  partnerName: string | null;
  partnerMeetYear: number | null;
  groupName: string | null;
  groupYear: number | null;
};
```

## GuestPartner

```ts
type GuestPartner = {
  id: string;
  guestId: number;
  names: string | null;
  lastName: string | null;
  scdLastName: string | null;
  date: string | null;
};
```

## GuestGroupMember

```ts
type GuestGroupMember = {
  id: string;
  guestId: number;
  name: string | null;
  lastName: string | null;
  scdLastName: string | null;
  date: string | null;
  dateInit: number | null;
};
```

## GuestEnergy

```ts
type GuestEnergy = {
  guest: Guest;
  guestPartners: GuestPartner[];
  guestGroupMembers: GuestGroupMember[];
};
```

## 3. Endpoints reales del backend

## Auth

### `POST /auth/login`

- metodo: `POST`
- body esperado:

```json
{
  "username": "nombre_de_acceso",
  "password": "secreto"
}
```

- response actual: `user + token + license + app_version`
- devuelve: entidad compuesta

### `GET /auth/me`

- metodo: `GET`
- body esperado: ninguno
- requiere Bearer token
- response actual: usuario simple
- devuelve: entidad simple

## Users

### `GET /users`

- metodo: `GET`
- body esperado: ninguno
- response actual: lista de usuarios con `license`
- devuelve: entidad con relacion incluida

### `GET /users/:id`

- metodo: `GET`
- body esperado: ninguno
- response actual: usuario simple
- devuelve: entidad simple

### `POST /users`

- metodo: `POST`
- body esperado: datos base de usuario
- response actual: usuario creado
- devuelve: entidad simple

### `PUT /users/:id`

- metodo: `PUT`
- body esperado: campos editables del usuario
- response actual: usuario actualizado
- devuelve: entidad simple

## GuestEnergy bajo Users

### `GET /users/:userId/guest-energy`

- metodo: `GET`
- body esperado: ninguno
- response actual:

```json
{
  "guest": {
    "id": 1,
    "userId": 10,
    "partnerName": "Nombre pareja",
    "partnerMeetYear": 2020,
    "groupName": "Grupo",
    "groupYear": 2022
  },
  "guestPartners": [],
  "guestGroupMembers": []
}
```

- devuelve: agregado con relaciones incluidas

### `POST /users/:userId/guest-energy`

- metodo: `POST`
- body esperado:

```json
{
  "partnerName": "Nombre pareja",
  "partnerMeetYear": 2020,
  "groupName": "Grupo",
  "groupYear": 2022
}
```

- comportamiento actual: crea o actualiza `guest` base por `userId`
- response actual: entidad `guest`
- devuelve: entidad simple

### `POST /users/:userId/guest-energy/partners`

- metodo: `POST`
- body esperado:

```json
{
  "names": "Persona",
  "lastName": "Apellido",
  "scdLastName": "SegundoApellido",
  "date": "2020-01-01"
}
```

- comportamiento actual:
  - resuelve `guest` por `userId`
  - crea el hijo con `guest.id`
- response actual: `guestPartner`
- devuelve: entidad simple

### `PUT /users/:userId/guest-energy/partners/:partnerId`

- metodo: `PUT`
- body esperado: campos editables del `guestPartner`
- response actual: `guestPartner` actualizado
- devuelve: entidad simple

### `DELETE /users/:userId/guest-energy/partners/:partnerId`

- metodo: `DELETE`
- body esperado: ninguno
- response actual: `guestPartner` eliminado
- devuelve: entidad simple

### `POST /users/:userId/guest-energy/group-members`

- metodo: `POST`
- body esperado:

```json
{
  "name": "Persona",
  "lastName": "Apellido",
  "scdLastName": "SegundoApellido",
  "date": "2020-01-01",
  "dateInit": 2022
}
```

- comportamiento actual:
  - resuelve `guest` por `userId`
  - crea el hijo con `guest.id`
- response actual: `guestGroupMember`
- devuelve: entidad simple

### `PUT /users/:userId/guest-energy/group-members/:memberId`

- metodo: `PUT`
- body esperado: campos editables del `guestGroupMember`
- response actual: `guestGroupMember` actualizado
- devuelve: entidad simple

### `DELETE /users/:userId/guest-energy/group-members/:memberId`

- metodo: `DELETE`
- body esperado: ninguno
- response actual: `guestGroupMember` eliminado
- devuelve: entidad simple

## Consultants

### `GET /consultants`

- metodo: `GET`
- response actual: lista de consultores con `user`
- devuelve: entidad con relacion incluida

### `GET /consultants/:id`

- metodo: `GET`
- response actual: consultor con:
  - `user`
  - `notes`
  - `partners`
  - `createNames`
  - `partnerData`
  - `groupData`
- devuelve: entidad con relaciones incluidas

### `GET /consultants/user/:userId`

- metodo: `GET`
- response actual: lista de consultores del usuario con:
  - `notes`
  - `partners`
  - `createNames`
  - `partnerData`
  - `groupData`
- devuelve: entidad con relaciones incluidas

### `POST /consultants`

- metodo: `POST`
- body esperado: datos del consultor
- si no viene `id`, el backend lo genera
- response actual: consultor creado
- devuelve: entidad simple

### `PUT /consultants/:id`

- metodo: `PUT`
- body esperado: datos editables del consultor
- response actual: consultor actualizado
- devuelve: entidad simple

### `DELETE /consultants/:id`

- metodo: `DELETE`
- response actual: consultor eliminado
- devuelve: entidad simple

## Notes bajo Consultants

### `GET /consultants/:consultantId/notes`

- metodo: `GET`
- body esperado: ninguno
- response actual: lista simple de notas

### `GET /consultants/:consultantId/notes/:noteId`

- metodo: `GET`
- body esperado: ninguno
- response actual: nota simple

### `POST /consultants/:consultantId/notes`

- metodo: `POST`
- body esperado:

```json
{
  "dateKey": "2026-06",
  "pathKey": "financial.summary",
  "value": "Texto de la nota"
}
```

- comportamiento actual: `upsert`
- clave logica:
  - `consultantId`
  - `dateKey`
  - `pathKey`
- response actual: nota creada o actualizada
- devuelve: entidad simple

### `PUT /consultants/:consultantId/notes/:noteId`

- metodo: `PUT`
- body esperado: campos editables de la nota
- response actual: nota actualizada
- devuelve: entidad simple

### `DELETE /consultants/:consultantId/notes/:noteId`

- metodo: `DELETE`
- body esperado: ninguno
- response actual: nota eliminada
- devuelve: entidad simple

## Create Names

### `POST /create-names/:consultantId`

- metodo: `POST`
- body esperado:

```json
{
  "name": "Nombre",
  "lastName": "Apellido",
  "scdLastName": "SegundoApellido",
  "birthDate": "2020-01-01",
  "isPerson": true
}
```

- el backend genera `id`
- response actual: entidad simple

### `PUT /create-names/:id`

- metodo: `PUT`
- body esperado: campos editables
- response actual: entidad simple

### `GET /create-names/:id`

- metodo: `GET`
- response actual: entidad simple

### `GET /create-names/consultant/:consultantId`

- metodo: `GET`
- response actual: lista simple

## Partner Data

### `POST /partner-data/:consultantId`

- metodo: `POST`
- body esperado:

```json
{
  "name": "Relacion",
  "date": "2020-01-01",
  "yearMeet": 2010
}
```

- genera `id`
- response actual: entidad padre simple

### `POST /partner-data/:partnerDataId/partner`

- metodo: `POST`
- body esperado:

```json
{
  "names": "Persona",
  "lastName": "Apellido",
  "scdLastName": "SegundoApellido",
  "date": "2020-01-01"
}
```

- genera `id`
- response actual: hijo simple

### `PUT /partner-data/:id`

- metodo: `PUT`
- body esperado: campos editables
- response actual: entidad actualizada

### `DELETE /partner-data/:id`

- metodo: `DELETE`
- response actual: entidad eliminada

### `GET /partner-data/:id`

- metodo: `GET`
- response actual: entidad simple

### `GET /partner-data/consultant/:consultantId`

- metodo: `GET`
- response actual: lista simple

## Group Data

### `POST /group-data/:consultantId`

- metodo: `POST`
- body esperado:

```json
{
  "name": "Grupo",
  "description": "Descripcion",
  "date": "2020-01-01",
  "lastInit": 2020
}
```

- genera `id`
- response actual: entidad padre simple

### `POST /group-data/:groupDataId/member`

- metodo: `POST`
- body esperado:

```json
{
  "name": "Persona",
  "lastName": "Apellido",
  "scdLastName": "SegundoApellido",
  "date": "2020-01-01",
  "dateInit": 2020
}
```

- genera `id`
- response actual: hijo simple

### `PUT /group-data/:id`

- metodo: `PUT`
- body esperado: campos editables
- response actual: entidad actualizada

### `DELETE /group-data/:id`

- metodo: `DELETE`
- response actual: entidad eliminada

### `GET /group-data/:id`

- metodo: `GET`
- response actual: entidad simple

### `GET /group-data/consultant/:consultantId`

- metodo: `GET`
- response actual: lista simple

## 4. Esquema de base de datos

El archivo mas valioso para relaciones reales es:

- [schema.prisma](C:/Users/andre/Documents/cursor/backend-sf-nume-v3/prisma/schema.prisma)

### Relaciones clave

### User

- `User` 1 a 1 `License`
- `User` 1 a N `Consultant`
- `User` 1 a 1 `Guest`

### Consultant

- `Consultant` pertenece a `User`
- `Consultant` 1 a N `ConsultantNote`
- `Consultant` 1 a N `ConsultantCreateName`
- `Consultant` 1 a N `ConsultantPartnerData`
- `Consultant` 1 a N `ConsultantGroupData`

### PartnerData

- `ConsultantPartnerData` pertenece a `Consultant`
- `ConsultantPartnerData` 1 a N `ConsultantPartnerDataPartner`

### GroupData

- `ConsultantGroupData` pertenece a `Consultant`
- `ConsultantGroupData` 1 a N `ConsultantGroupDataMember`

### GuestEnergy

- `Guest` pertenece a `User`
- `Guest` 1 a N `GuestPartner`
- `Guest` 1 a N `GuestGroupMember`

## 5. Si existe, tipado o DTOs del backend

## Tipado existente

Existe tipado principalmente como aliases de Prisma models en `src/models`.

Ejemplos:

- `UserModel`
- `ConsultantModel`
- `ConsultantCreateNameModel`
- `ConsultantPartnerDataModel`
- `ConsultantGroupDataModel`
- `ConsultantNoteModel`
- `GuestModel`
- `GuestPartnerModel`
- `GuestGroupMemberModel`
- `GuestEnergyModel`

## Validators existentes

### Auth

- [authValidator.ts](C:/Users/andre/Documents/cursor/backend-sf-nume-v3/src/validators/authValidator.ts)

Valida:

- `username`
- `password`

### User

- [userValidator.ts](C:/Users/andre/Documents/cursor/backend-sf-nume-v3/src/validators/userValidator.ts)

Valida:

- `firstName`
- `lastName`
- `scdLastName`
- `birthDate`

### Consultant

- [consultantValidator.ts](C:/Users/andre/Documents/cursor/backend-sf-nume-v3/src/validators/consultantValidator.ts)

Valida:

- `names`
- `lastName`
- `scdLastName`
- `date`

### CreateName

- [createNameValidator.ts](C:/Users/andre/Documents/cursor/backend-sf-nume-v3/src/validators/createNameValidator.ts)

Valida:

- `name`
- `birthDate`
- si `isPerson = true`, exige:
  - `lastName`
  - `scdLastName`

### PartnerData

- [consultantPartnerDataValidator.ts](C:/Users/andre/Documents/cursor/backend-sf-nume-v3/src/validators/consultantPartnerDataValidator.ts)

Valida padre:

- `name`
- `date`

Valida hijo:

- `names`
- `lastName`
- `scdLastName`
- `date`

### GroupData

- [consultantGroupDataValidator.ts](C:/Users/andre/Documents/cursor/backend-sf-nume-v3/src/validators/consultantGroupDataValidator.ts)

Valida padre:

- `name`
- `date`

Valida hijo:

- `name`
- `lastName`
- `scdLastName`
- `date`

### Notes

No hay validator dedicado separado. La validacion actual vive en:

- [consultantNoteService.ts](C:/Users/andre/Documents/cursor/backend-sf-nume-v3/src/services/consultantNoteService.ts)

Valida:

- `consultantId`
- `dateKey`
- `pathKey`

### GuestEnergy

No hay validator dedicado separado. La validacion actual vive en:

- [guestEnergyService.ts](C:/Users/andre/Documents/cursor/backend-sf-nume-v3/src/services/guestEnergyService.ts)

Valida principalmente:

- `userId`
- `guestId` para hijos

## DTOs formales

No hay DTO classes ni schemas Zod formales.

El contrato actual se expresa via:

- `Prisma.*CreateInput`
- `Prisma.*UncheckedCreateInput`
- `Prisma.*UpdateInput`
- validaciones manuales
- transformaciones en controllers

## 6. Decisiones funcionales

## Notes

### Decision actual

`notes` es tabla propia en base de datos.

Hoy tiene doble acceso:

- como relacion anidada dentro de `consultant`
- como subrecurso REST dentro de `consultants`

### Implicacion

- existe storage independiente
- existe API REST publicada
- frontend puede leer notas desde el consultor o desde endpoints dedicados
- el `POST` actual de notas funciona como `upsert`

## GuestEnergy

### Decision actual

`guestEnergy` pertenece al `User`, no al `Consultant`.

Se refleja en:

- `User` 1 a 1 `Guest`

### Implicacion

Frontend debe modelarlo como agregado del usuario.

Ademas:

- existe endpoint para obtener el agregado completo
- `guestPartners` y `guestGroupMembers` se crean por rutas separadas
- primero debe existir o resolverse el `guest` base del usuario

## Consultant y relaciones

### Decision actual

Cuando frontend pide:

- `GET /consultants/:id`
- `GET /consultants/user/:userId`

si vienen incluidas relaciones importantes:

- `notes`
- `partners`
- `createNames`
- `partnerData`
- `groupData`

### Implicacion

Para pantallas detalle de consultor, muchas veces no hace falta disparar requests separados para esos modulos.

## PartnerData y GroupData

### Decision actual

Ambos modulos se trabajan como agregado de `Consultant`, pero sus hijos se crean por endpoints separados.

### Implicacion

- primero se crea padre
- luego se crean hijos
- frontend no debe asumir create cascada en un solo request

## Usuario local en auth

### Decision actual

Como WordPress no devuelve perfil completo en login, el backend mantiene un usuario local minimo para sostener:

- JWT
- licencia sincronizada
- relaciones con el resto del dominio

### Implicacion

Ese usuario local no debe interpretarse como perfil completo de identidad.
