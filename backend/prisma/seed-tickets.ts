import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const customers = [
  { email: "alice.johnson@gmail.com", name: "Alice Johnson" },
  { email: "bob.williams@yahoo.com", name: "Bob Williams" },
  { email: "carol.davis@outlook.com", name: "Carol Davis" },
  { email: "dan.miller@gmail.com", name: "Dan Miller" },
  { email: "emily.chen@hotmail.com", name: "Emily Chen" },
  { email: "frank.garcia@gmail.com", name: "Frank Garcia" },
  { email: "grace.lee@yahoo.com", name: "Grace Lee" },
  { email: "henry.kim@outlook.com", name: "Henry Kim" },
  { email: "irene.patel@gmail.com", name: "Irene Patel" },
  { email: "jack.thomas@hotmail.com", name: "Jack Thomas" },
  { email: "karen.brown@gmail.com", name: "Karen Brown" },
  { email: "leo.martinez@yahoo.com", name: "Leo Martinez" },
  { email: "mia.anderson@outlook.com", name: "Mia Anderson" },
  { email: "noah.taylor@gmail.com", name: "Noah Taylor" },
  { email: "olivia.wilson@hotmail.com", name: "Olivia Wilson" },
];

const ticketTemplates = [
  // TECHNICAL — AI resolvable
  { subject: "Videos not playing in my browser", body: "I am trying to watch the React course but the videos just show a black screen. I have tried refreshing the page multiple times.", category: "TECHNICAL" },
  { subject: "Low video quality on the Python course", body: "The video quality on section 3 of the Python course is very blurry. Is there a way to increase the resolution?", category: "TECHNICAL" },
  { subject: "Cannot access my enrolled course", body: "I purchased the Node.js course yesterday but when I log in I cannot see it in my dashboard. I have the receipt email.", category: "TECHNICAL" },
  { subject: "Browser extension blocking videos", body: "I think my ad blocker is preventing the course videos from loading. Which extensions should I disable?", category: "TECHNICAL" },
  // REFUND — AI resolvable
  { subject: "Refund request for JavaScript course", body: "I bought the JavaScript course 5 days ago but realized it covers topics I already know. Can I get a refund?", category: "REFUND" },
  { subject: "How do I request a refund?", body: "I would like to return the SQL course I purchased last week. What is the process for getting my money back?", category: "REFUND" },
  { subject: "Refund for duplicate purchase", body: "I accidentally purchased the same course twice. Can you refund the duplicate charge?", category: "REFUND" },
  // GENERAL — AI resolvable
  { subject: "Do you offer certificates?", body: "I am about to finish the Docker course. Will I receive a certificate of completion? Where can I find it?", category: "GENERAL" },
  { subject: "Forgot my password", body: "I cannot log into my account because I forgot my password. How do I reset it?", category: "GENERAL" },
  { subject: "Can I download the videos?", body: "I will be traveling next week without internet. Is there a way to download the course videos for offline viewing?", category: "GENERAL" },
  { subject: "What does lifetime access mean?", body: "I saw that courses come with lifetime access. Does that mean I get all future updates too?", category: "GENERAL" },
  { subject: "Coupon code not working", body: "I have a 20% off coupon but it says invalid when I try to apply it at checkout. The code is SAVE20.", category: "GENERAL" },
  // NOT AI resolvable — will stay OPEN
  { subject: "Partnership inquiry from university", body: "We are a university looking to integrate your courses into our curriculum. Can we discuss licensing options?", category: "GENERAL" },
  { subject: "Course content is outdated", body: "The Angular course still uses Angular 12 but the latest version is Angular 19. When will it be updated?", category: "TECHNICAL" },
  { subject: "Charged but no access after 48 hours", body: "I was charged $29.99 two days ago but still cannot access the course. My bank shows the charge went through. This is unacceptable.", category: "REFUND" },
  { subject: "Account hacked — unauthorized purchases", body: "Someone accessed my account and made purchases I did not authorize. I need this investigated immediately.", category: "GENERAL" },
  { subject: "Legal question about course licensing", body: "I want to use clips from your courses in my YouTube tutorials. What are the licensing terms?", category: "GENERAL" },
  { subject: "Request for corporate training program", body: "Our company has 50 developers who need training. Do you offer enterprise plans or bulk pricing?", category: "GENERAL" },
  { subject: "Accessibility issues with course player", body: "I am visually impaired and the video player does not work well with my screen reader. Can you help?", category: "TECHNICAL" },
  { subject: "Course recommendation for data science", body: "I want to get into data science but I am not sure which of your courses to start with. Can you recommend a learning path?", category: "GENERAL" },
];

function randomDate(start: Date, end: Date) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

async function main() {
  // Get admin user for agent messages
  const admin = await prisma.user.findFirst({ select: { id: true, name: true } });
  if (!admin) throw new Error("No user found — run the main seed first");

  // Clear existing tickets and messages
  await prisma.message.deleteMany();
  await prisma.ticket.deleteMany();
  console.log("Cleared existing tickets and messages");

  const marchStart = new Date("2026-03-01T00:00:00Z");
  const marchEnd = new Date("2026-03-31T23:59:59Z");

  const aiReplyTemplates = [
    "Hi {name},\n\nThank you for reaching out. {answer}\n\nIf you have any other questions, feel free to ask.\n\nBest regards,\nCode with Mosh Support",
    "Hi {name},\n\n{answer}\n\nPlease let us know if there is anything else we can help with.\n\nBest regards,\nCode with Mosh Support",
  ];

  const agentReplyTemplates = [
    "Hi {name},\n\nThank you for contacting us. I have looked into this and {answer}\n\nLet me know if you need anything else.\n\nBest,\n{agent}",
    "Hello {name},\n\n{answer}\n\nDon't hesitate to reach out if you have further questions.\n\n{agent}",
  ];

  const aiAnswers: Record<string, string> = {
    "Videos not playing in my browser": "Please try clearing your browser cache, using the latest version of Chrome or Edge, and disabling any browser extensions. Also make sure your internet connection is stable.",
    "Low video quality on the Python course": "Video quality adjusts automatically based on your internet speed. Please ensure you have a stable internet connection for the best viewing experience.",
    "Cannot access my enrolled course": "This could happen if you are logged in with a different email address or if the payment is still processing. Please check your receipt email for confirmation.",
    "Browser extension blocking videos": "Ad blockers and privacy extensions can sometimes interfere with video playback. Try disabling them or using an incognito window.",
    "Refund request for JavaScript course": "We offer a 30-day money-back guarantee. Since your purchase was within 30 days, you are eligible for a full refund. Please provide your order receipt and we will process it within 5-10 business days.",
    "How do I request a refund?": "To request a refund, contact support within 30 days of purchase, provide your order receipt, and include the reason for your request. Refunds are processed within 5-10 business days.",
    "Refund for duplicate purchase": "We can certainly help with that. Please provide your order receipt for the duplicate purchase and we will process the refund within 5-10 business days.",
    "Do you offer certificates?": "Yes! A certificate of completion is issued when you finish the course. You can find it in your dashboard after completing all the lessons.",
    "Forgot my password": "You can reset your password by going to the login page, clicking Forgot Password, and entering your registered email. Follow the instructions in the reset email.",
    "Can I download the videos?": "Videos are streamed online and offline downloads are not supported. However, you can download the source code for offline reference.",
    "What does lifetime access mean?": "Lifetime Access means you pay once and keep access permanently, including all future updates for that course.",
    "Coupon code not working": "Possible reasons include: the coupon has expired, it was already used, or it is not valid for the selected course. Only one coupon may be applied per purchase.",
  };

  let ticketId = 0;

  for (let day = 1; day <= 31; day++) {
    // 15-25 tickets per day (~20 avg)
    const count = 15 + Math.floor(Math.random() * 11);

    for (let t = 0; t < count; t++) {
      ticketId++;
      const template = pick(ticketTemplates);
      const customer = pick(customers);
      const createdAt = randomDate(
        new Date(`2026-03-${String(day).padStart(2, "0")}T06:00:00Z`),
        new Date(`2026-03-${String(day).padStart(2, "0")}T20:00:00Z`),
      );

      const aiAnswer = aiAnswers[template.subject];
      const isAiResolvable = !!aiAnswer;

      // Decide ticket fate
      let status: string;
      let resolvedAt: Date | undefined;
      if (isAiResolvable && Math.random() < 0.7) {
        // 70% of AI-resolvable tickets get auto-resolved
        status = "RESOLVED";
        resolvedAt = new Date(createdAt.getTime() + 5000 + Math.random() * 10000); // 5-15s later
      } else if (!isAiResolvable && Math.random() < 0.4) {
        // 40% of non-AI tickets get resolved by agent
        status = "RESOLVED";
        resolvedAt = new Date(createdAt.getTime() + (30 + Math.random() * 180) * 60000); // 30min-3.5h later
      } else if (Math.random() < 0.1) {
        status = "CLOSED";
        resolvedAt = new Date(createdAt.getTime() + (60 + Math.random() * 360) * 60000);
      } else {
        status = "OPEN";
      }

      const ticket = await prisma.ticket.create({
        data: {
          subject: template.subject,
          senderEmail: customer.email,
          senderName: customer.name,
          status: status as "OPEN" | "RESOLVED" | "CLOSED",
          category: template.category as "GENERAL" | "TECHNICAL" | "REFUND",
          createdAt,
          updatedAt: resolvedAt ?? createdAt,
        },
      });

      // Customer message
      await prisma.message.create({
        data: {
          body: template.body,
          sender: customer.name,
          senderType: "CUSTOMER",
          ticketId: ticket.id,
          createdAt,
        },
      });

      // Add reply if resolved
      if (status === "RESOLVED" || status === "CLOSED") {
        const firstName = customer.name.split(" ")[0]!;

        if (isAiResolvable && resolvedAt && resolvedAt.getTime() - createdAt.getTime() < 60000) {
          // AI resolved
          const replyTemplate = pick(aiReplyTemplates);
          await prisma.message.create({
            data: {
              body: replyTemplate.replace("{name}", firstName).replace("{answer}", aiAnswer!),
              sender: "Code with Mosh Support",
              senderType: "AGENT",
              isAiGenerated: true,
              ticketId: ticket.id,
              createdAt: resolvedAt,
            },
          });
        } else if (resolvedAt) {
          // Agent resolved
          const replyTemplate = pick(agentReplyTemplates);
          const agentAnswer = aiAnswer ?? "I have resolved your issue. Please check your account and let me know if everything is working now.";
          await prisma.message.create({
            data: {
              body: replyTemplate
                .replace("{name}", firstName)
                .replace("{answer}", agentAnswer)
                .replace("{agent}", admin.name),
              sender: admin.name,
              senderType: "AGENT",
              isAiGenerated: false,
              userId: admin.id,
              ticketId: ticket.id,
              createdAt: resolvedAt,
            },
          });
        }
      }
    }
  }

  console.log(`Seeded ${ticketId} tickets across March 2026`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
