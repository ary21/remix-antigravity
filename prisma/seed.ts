import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

async function main() {
    console.log("Seeding database...");

    // Create 100 random customers
    const customers = [];
    for (let i = 0; i < 100; i++) {
        customers.push({
            name: faker.person.fullName(),
            email: faker.internet.email(),
            phone: faker.phone.number(),
            address: faker.location.streetAddress(),
        });
    }

    console.log(`Creating ${customers.length} customers...`);
    await prisma.customer.createMany({
        data: customers,
    });

    console.log("Seeding completed.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
