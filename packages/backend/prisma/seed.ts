import { PrismaClient, UserRole, VerifiedStatus, CampaignStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const NICHOS = ["DeFi", "NFTs", "Trading", "Web3 Gaming", "Fintech", "Educación Cripto", "Blockchain", "Stablecoins"];

function pickNichos(): string[] {
  const shuffled = [...NICHOS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 2);
}

async function main() {
  console.log("Sembrando datos demo de Casa Creadores...");

  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@casacreadores.com" },
    update: {},
    create: {
      email: "admin@casacreadores.com",
      password: adminPassword,
      role: UserRole.ADMIN,
      emailVerified: true,
    },
  });
  console.log(`Admin creado: ${admin.email}`);

  const demoBrandPassword = await bcrypt.hash("marca123", 10);
  const brandUser = await prisma.user.upsert({
    where: { email: "marca@hivello.com" },
    update: {},
    create: {
      email: "marca@hivello.com",
      password: demoBrandPassword,
      role: UserRole.MARCA,
      emailVerified: true,
      brand: {
        create: {
          companyName: "Hivello",
          website: "https://hivello.com",
          industry: "Fintech",
        },
      },
    },
    include: { brand: true },
  });
  const brand = brandUser.brand ?? (await prisma.brand.findUnique({ where: { userId: brandUser.id } }));
  console.log(`Marca demo creada: ${brandUser.email}`);

  const creatorHandles = [
    { x: "@cryptolucia", ig: "lucia.cripto", followers: 125000, verified: VerifiedStatus.VERIFIED },
    { x: "@satoshi_mx", ig: "satoshi.mx", followers: 89000, verified: VerifiedStatus.VERIFIED },
    { x: "@defi_carla", ig: "carla.defi", followers: 42000, verified: VerifiedStatus.VERIFIED },
    { x: "@tradingjuanpa", ig: "juanpa.trading", followers: 210000, verified: VerifiedStatus.PENDING },
    { x: "@web3ana", ig: "ana.web3", followers: 15000, verified: VerifiedStatus.PENDING },
    { x: "@blockchain_diego", ig: "diego.chain", followers: 67000, verified: VerifiedStatus.VERIFIED },
    { x: "@nftmaria", ig: "maria.nft", followers: 33000, verified: VerifiedStatus.PENDING },
    { x: "@fintechpablo", ig: "pablo.fintech", followers: 98000, verified: VerifiedStatus.VERIFIED },
    { x: "@cripto_valentina", ig: "valen.cripto", followers: 156000, verified: VerifiedStatus.VERIFIED },
    { x: "@stablecoinrodrigo", ig: "rodrigo.stable", followers: 24000, verified: VerifiedStatus.PENDING },
  ];

  const creators = [];
  for (let i = 0; i < creatorHandles.length; i++) {
    const h = creatorHandles[i];
    const email = `creador${i + 1}@casacreadores.demo`;
    const password = await bcrypt.hash("creador123", 10);
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        password,
        role: UserRole.CREADOR,
        emailVerified: true,
        creator: {
          create: {
            bio: `Creador de contenido cripto/fintech en LATAM. ${h.x}`,
            xHandle: h.x,
            igHandle: h.ig,
            tiktokHandle: null,
            verifiedStatus: h.verified,
            followerCount: h.followers,
            nichos: pickNichos(),
          },
        },
      },
      include: { creator: true },
    });
    creators.push(user.creator);
  }
  console.log(`${creators.length} creadores demo creados.`);

  if (brand) {
    const campaignsData = [
      {
        title: "Lanzamiento wallet USDC LATAM",
        description: "Buscamos creadores para promocionar el lanzamiento de nuestra wallet de USDC en México y Colombia.",
        budgetUSDC: 5000,
        duration: 30,
        minFollowers: 20000,
        minEngagementRate: 2.5,
        status: CampaignStatus.ACTIVE,
      },
      {
        title: "Serie educativa: DeFi para principiantes",
        description: "Contenido educativo en video corto explicando conceptos de DeFi para audiencias hispanohablantes.",
        budgetUSDC: 3000,
        duration: 21,
        minFollowers: 10000,
        minEngagementRate: 3,
        status: CampaignStatus.ACTIVE,
      },
      {
        title: "Reto de trading con stablecoins",
        description: "Campaña de challenge/reto en redes sociales sobre trading responsable usando stablecoins.",
        budgetUSDC: 8000,
        duration: 45,
        minFollowers: 50000,
        minEngagementRate: 2,
        status: CampaignStatus.DRAFT,
      },
    ];

    for (const c of campaignsData) {
      await prisma.campaign.create({
        data: { ...c, brandId: brand.id },
      });
    }
    console.log(`${campaignsData.length} campañas demo creadas.`);
  }

  console.log("Seed completo.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
