declare module 'jsonwebtoken' {
  export function sign(
    payload: string | Buffer | object,
    secretOrPrivateKey: string,
    options?: { expiresIn?: string | number }
  ): string;

  export function verify(token: string, secretOrPublicKey: string): unknown;

  const jwt: {
    sign: typeof sign;
    verify: typeof verify;
  };

  export default jwt;
}
