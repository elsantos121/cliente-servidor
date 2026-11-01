import { AfterAll } from '@cucumber/cucumber';
import { prisma } from '../../tests/helpers/db';

AfterAll(async () => {
  await prisma.$disconnect();
});
