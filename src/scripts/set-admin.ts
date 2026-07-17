/* eslint-disable no-console */
/**
 * Asigna (o quita) el rol de administrador a un usuario por email.
 *
 * Uso:
 *   npx ts-node src/scripts/set-admin.ts correo@dominio.com
 *   npx ts-node src/scripts/set-admin.ts correo@dominio.com --revoke
 */
import 'dotenv/config';
import { prisma } from '../lib/prisma';

async function main() {
  const email = process.argv[2]?.trim();
  const revoke = process.argv.includes('--revoke');

  if (!email || email.startsWith('--')) {
    console.error('Uso: npx ts-node src/scripts/set-admin.ts <email> [--revoke]');
    process.exitCode = 1;
    return;
  }

  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
    select: { id: true, email: true, role: true },
  });

  if (!user) {
    console.error(`No existe un usuario con email ${email}`);
    process.exitCode = 1;
    return;
  }

  const role = revoke ? 'user' : 'admin';
  await prisma.user.update({ where: { id: user.id }, data: { role } });
  console.log(`${user.email} (id ${user.id}): rol '${user.role}' -> '${role}'`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
