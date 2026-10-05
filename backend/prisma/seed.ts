import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient, Prisma } from '../generated/prisma/client.js';

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  }),
});

const places = [
  {
    name: 'Milford Sound',
    region: 'Fiordland',
    description:
      'A breathtaking fiord in Fiordland National Park, carved by glaciers and surrounded by towering cliffs and waterfalls.',
    latitude: -44.6725,
    longitude: 167.9246,
  },
  {
    name: 'Hobbiton Movie Set',
    region: 'Waikato',
    description:
      'The famous movie-set village from The Lord of the Rings, set on a working sheep farm near Matamata.',
    latitude: -37.872,
    longitude: 175.6833,
  },
  {
    name: 'Rotorua Geothermal Reserve',
    region: 'Bay of Plenty',
    description:
      'Geysers, bubbling mud pools and steaming hotspots showcase New Zealand’s powerful volcanic activity.',
    latitude: -38.1368,
    longitude: 176.2497,
  },
  {
    name: 'Queenstown',
    region: 'Otago',
    description:
      'The adventure capital of New Zealand on the shores of Lake Wakatipu, ringed by the Southern Alps.',
    latitude: -45.0312,
    longitude: 168.6626,
  },
  {
    name: 'Tongariro Alpine Crossing',
    region: 'Waikato',
    description:
      'One of the worlds best one-day hikes, crossing volcanic terrain with emerald lakes and Mount Ngauruhoe.',
    latitude: -39.1572,
    longitude: 175.6317,
  },
  {
    name: 'Abel Tasman National Park',
    region: 'Tasman',
    description:
      'Golden-sand beaches, native forest and clear turquoise water, best explored by kayak or coastal track.',
    latitude: -40.9667,
    longitude: 173.05,
  },
  {
    name: 'Waitangi Treaty Grounds',
    region: 'Northland',
    description:
      'The birthplace of New Zealand as a nation, where the Treaty of Waitangi was signed in 1840.',
    latitude: -35.2682,
    longitude: 174.0807,
  },
  {
    name: 'Fox Glacier',
    region: 'West Coast',
    description:
      'A dramatic glacier descending into temperate rainforest in Westland Tai Poutini National Park.',
    latitude: -43.4649,
    longitude: 170.012,
  },
] satisfies Prisma.PlaceCreateManyInput[];

async function main() {
  console.log('Resetting and seeding OurTearoa local database...');

  await prisma.itineraryEntry.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.review.deleteMany();
  await prisma.place.deleteMany();
  await prisma.user.deleteMany();

  const user = await prisma.user.create({
    data: {
      email: 'demo@ourtearoa.dev',
      password: 'demo-password',
      name: 'Demo Explorer',
    },
  });

  for (const place of places) {
    await prisma.place.create({ data: place });
  }

  const firstPlaces = await prisma.place.findMany({ take: 5 });

  await prisma.review.create({
    data: {
      userId: user.id,
      placeId: firstPlaces[0]!.id,
      rating: 5,
      comment: 'Absolutely stunning at sunrise. A must-visit!',
    },
  });

  await prisma.review.create({
    data: {
      userId: user.id,
      placeId: firstPlaces[1]!.id,
      rating: 4,
      comment: 'Great day trip, quite busy in summer.',
    },
  });

  await prisma.favorite.createMany({
    data: [
      { userId: user.id, placeId: firstPlaces[0]!.id },
      { userId: user.id, placeId: firstPlaces[3]!.id },
      { userId: user.id, placeId: firstPlaces[4]!.id },
    ],
  });

  const today = new Date();
  await prisma.itineraryEntry.create({
    data: {
      userId: user.id,
      placeId: firstPlaces[2]!.id,
      startDate: today,
      endDate: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000),
      note: 'Whakarewarewa + Polynesian Spa',
    },
  });

  const counts = {
    users: await prisma.user.count(),
    places: await prisma.place.count(),
    reviews: await prisma.review.count(),
    favorites: await prisma.favorite.count(),
    itineraryEntries: await prisma.itineraryEntry.count(),
  };

  console.log('Seed complete:', counts);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });