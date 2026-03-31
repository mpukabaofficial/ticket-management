const API_URL = "http://localhost:3000/api/tickets/email";

const tickets = [
  { from: "sarah.johnson@gmail.com", senderName: "Sarah Johnson", subject: "Cannot access Advanced Python course", body: "I purchased the Advanced Python course yesterday but still see a lock icon. My order confirmation number is #ORD-4521." },
  { from: "mike.chen@outlook.com", senderName: "Mike Chen", subject: "Video lectures buffering constantly", body: "Every video in the Data Science Bootcamp keeps buffering every 10 seconds. My internet speed is 100mbps so it is not on my end." },
  { from: "emma.williams@yahoo.com", senderName: "Emma Williams", subject: "Request refund for UX Design course", body: "I would like a full refund for the UX Design Fundamentals course. I enrolled 3 days ago and the content is not what was advertised." },
  { from: "james.patel@hotmail.com", senderName: "James Patel", subject: "Certificate not generating after course completion", body: "I completed the JavaScript Mastery course 2 days ago but the certificate download button is greyed out. My progress shows 100%." },
  { from: "olivia.martinez@gmail.com", senderName: "Olivia Martinez", subject: "Quiz answers marked wrong incorrectly", body: "In Module 5 Quiz of React Fundamentals, question 3 about useEffect dependencies - my answer was correct but marked wrong." },
  { from: "daniel.kim@proton.me", senderName: "Daniel Kim", subject: "Cannot submit final project", body: "The file upload for the final project in Full Stack Development keeps failing with a timeout error. I have tried PDF and ZIP formats." },
  { from: "aisha.rahman@gmail.com", senderName: "Aisha Rahman", subject: "Refund request - duplicate charge", body: "I was charged twice for the Machine Learning Specialization. Transaction IDs: TXN-8832 and TXN-8833. Please refund the duplicate." },
  { from: "lucas.garcia@outlook.com", senderName: "Lucas Garcia", subject: "Course content outdated - React 16 not 19", body: "The React Advanced Patterns course still teaches React 16 class components. The description says React 19. This is misleading." },
  { from: "priya.sharma@gmail.com", senderName: "Priya Sharma", subject: "Login loop on mobile browser", body: "On my iPhone Safari, after entering credentials I get redirected back to the login page. Works fine on desktop Chrome." },
  { from: "tom.wilson@yahoo.com", senderName: "Tom Wilson", subject: "Need invoice for company reimbursement", body: "I need a proper invoice with my company details for the DevOps Engineering course for tax/reimbursement purposes." },
  { from: "nina.kowalski@gmail.com", senderName: "Nina Kowalski", subject: "Subtitles out of sync in SQL course", body: "The subtitles in the SQL Masterclass videos are about 3 seconds ahead of the audio starting from Module 3." },
  { from: "raj.verma@outlook.com", senderName: "Raj Verma", subject: "Cannot download course materials", body: "The PDF downloads for AWS Cloud Practitioner course return 404 errors. All 12 PDF links are broken." },
  { from: "sophie.dubois@gmail.com", senderName: "Sophie Dubois", subject: "Refund - medical emergency cannot complete", body: "Due to a medical emergency I cannot complete the 6-month Data Engineering program. I am requesting a prorated refund for remaining months." },
  { from: "alex.thompson@proton.me", senderName: "Alex Thompson", subject: "Assignment submission deadline extension", body: "I missed the Week 4 assignment deadline for the Cybersecurity course by 2 hours due to a power outage. Can I get an extension?" },
  { from: "maria.santos@gmail.com", senderName: "Maria Santos", subject: "Course progress reset to zero", body: "I was 67% through the Digital Marketing course and today all my progress shows 0%. I need this restored ASAP." },
  { from: "david.lee@outlook.com", senderName: "David Lee", subject: "Mentor not responding for 5 days", body: "My assigned mentor for the AI Engineering bootcamp has not responded to any of my 4 messages in 5 days." },
  { from: "fatima.hassan@yahoo.com", senderName: "Fatima Hassan", subject: "Payment declined but course access granted", body: "My credit card was declined for the Node.js course but I somehow got access. I want to make sure I am properly enrolled." },
  { from: "john.murphy@gmail.com", senderName: "John Murphy", subject: "Group discount inquiry for team of 15", body: "I am looking to enroll my development team of 15 people in the Agile Project Management course. Do you offer group discounts?" },
  { from: "yuki.tanaka@outlook.com", senderName: "Yuki Tanaka", subject: "Audio quality terrible in new uploads", body: "The recently added videos in Modules 8-10 of the TypeScript course have very low audio quality with background noise." },
  { from: "carlos.rivera@gmail.com", senderName: "Carlos Rivera", subject: "Need to transfer course to colleague", body: "I am leaving my company and need to transfer my Kubernetes course enrollment to my colleague who will take over my role." },
  { from: "hannah.brown@proton.me", senderName: "Hannah Brown", subject: "Exam proctoring software not working on Linux", body: "The proctoring software for the certification exam does not support Ubuntu 22.04. I only have Linux machines." },
  { from: "ahmed.ibrahim@gmail.com", senderName: "Ahmed Ibrahim", subject: "Refund request within 14-day window", body: "I enrolled in the Blockchain Development course 5 days ago. The pace is too fast for me as a beginner. Requesting a full refund." },
  { from: "lisa.anderson@outlook.com", senderName: "Lisa Anderson", subject: "Cannot access forum discussions", body: "The community forum for the Product Management course returns a 403 Forbidden error when I try to view any thread." },
  { from: "peter.wright@yahoo.com", senderName: "Peter Wright", subject: "Completion badge not showing on LinkedIn", body: "I completed the Google Cloud course and shared my badge but it does not appear on my LinkedIn profile. The share button seems broken." },
  { from: "chen.wei@gmail.com", senderName: "Chen Wei", subject: "Inconsistent grading between TAs", body: "Different TAs are grading the same type of assignments with very different standards in the Software Engineering course." },
  { from: "rachel.green@outlook.com", senderName: "Rachel Green", subject: "Course page showing wrong language", body: "The entire UI of the iOS Development course suddenly switched to Japanese. I have not changed any language settings." },
  { from: "mohammed.ali@gmail.com", senderName: "Mohammed Ali", subject: "Accessibility - screen reader not working with player", body: "The video player is not compatible with NVDA screen reader. I am visually impaired and cannot navigate the controls." },
  { from: "kate.miller@proton.me", senderName: "Kate Miller", subject: "Charged annual price instead of monthly", body: "I selected the monthly plan at $29/month but was charged $299 for the annual plan. Please correct this billing error." },
  { from: "andrei.popov@gmail.com", senderName: "Andrei Popov", subject: "Lab environment keeps crashing", body: "The cloud lab environment for the Docker course crashes every 15-20 minutes and I lose all my work. This has happened 8 times today." },
  { from: "jessica.taylor@outlook.com", senderName: "Jessica Taylor", subject: "Need extension due to parental leave", body: "I just had a baby and need to pause my Data Analytics bootcamp for 8 weeks. Can my enrollment be extended?" },
  { from: "kevin.nguyen@gmail.com", senderName: "Kevin Nguyen", subject: "Code examples not working in Python 3.12", body: "Several code examples in the Python Web Development course use deprecated syntax that throws errors in Python 3.12." },
  { from: "laura.fischer@yahoo.com", senderName: "Laura Fischer", subject: "Refund - course level too advanced", body: "The Intermediate SQL course assumes knowledge of window functions and CTEs which I do not have. The prerequisites were not clear." },
  { from: "sam.jackson@gmail.com", senderName: "Sam Jackson", subject: "Two-factor authentication locked me out", body: "I changed my phone and now I cannot get past the 2FA screen. I do not have my backup codes either. Need account recovery." },
  { from: "maya.patel@outlook.com", senderName: "Maya Patel", subject: "Capstone project feedback missing", body: "It has been 3 weeks since I submitted my capstone project for the Data Science bootcamp and I still have not received any feedback." },
  { from: "brian.campbell@proton.me", senderName: "Brian Campbell", subject: "Course videos playing at wrong speed", body: "All videos in the Rust Programming course play at 1.5x speed by default and the speed selector is broken." },
  { from: "elena.volkov@gmail.com", senderName: "Elena Volkov", subject: "Duplicate course appearing in my dashboard", body: "The Go Programming course appears twice in my dashboard. I only purchased it once but see two identical entries." },
  { from: "mark.davis@outlook.com", senderName: "Mark Davis", subject: "API documentation links all 404", body: "Every external API documentation link in the REST API Design course leads to a 404 page. At least 20 links are broken." },
  { from: "amanda.clark@gmail.com", senderName: "Amanda Clark", subject: "Cannot cancel subscription", body: "The cancel subscription button on my account page does nothing when clicked. I have been trying for 3 days." },
  { from: "ryan.scott@yahoo.com", senderName: "Ryan Scott", subject: "Course video downloaded but will not play offline", body: "I downloaded Module 6 videos for the Flutter course for offline viewing but they show a DRM error when I try to play them." },
  { from: "zara.ahmad@gmail.com", senderName: "Zara Ahmad", subject: "Instructor made factual error in lecture", body: "In the Networking Fundamentals course, Lecture 7, the instructor says TCP is connectionless. This is incorrect." },
  { from: "nick.harris@outlook.com", senderName: "Nick Harris", subject: "Need to upgrade from basic to premium plan", body: "I want to upgrade my Basic plan to Premium to access the mentor sessions. Will my progress be preserved?" },
  { from: "diana.ross@gmail.com", senderName: "Diana Ross", subject: "Refund - accidentally purchased wrong course", body: "I meant to buy the Angular course but accidentally purchased the AngularJS (v1) course. I need a refund." },
  { from: "stefan.mueller@proton.me", senderName: "Stefan Mueller", subject: "Peer review assignment stuck in queue", body: "My peer review assignment for the Machine Learning course has been in the review queue for 12 days. No one has reviewed it." },
  { from: "grace.kim@gmail.com", senderName: "Grace Kim", subject: "Course certificate has wrong name", body: "My completion certificate for the Project Management course shows Grace K instead of my full name Grace Kim." },
  { from: "tomas.novak@outlook.com", senderName: "Tomas Novak", subject: "Dark mode breaks code syntax highlighting", body: "When dark mode is enabled, the code blocks in the C++ course show white text on a light gray background. Completely unreadable." },
  { from: "amy.wright@yahoo.com", senderName: "Amy Wright", subject: "Live session recording not available", body: "The live Q&A session from last Thursday for the UI/UX Bootcamp was supposed to be recorded but the recording link says Not Available." },
  { from: "omar.hassan@gmail.com", senderName: "Omar Hassan", subject: "Enrollment confirmation email not received", body: "I completed payment for the Ethical Hacking course 2 hours ago but have not received any confirmation email." },
  { from: "julia.white@outlook.com", senderName: "Julia White", subject: "Progress bar showing more than 100%", body: "My progress for the HTML/CSS course shows 103%. I think the progress calculation is bugged after they added new modules." },
  { from: "henry.zhao@gmail.com", senderName: "Henry Zhao", subject: "Cannot leave course review", body: "After completing the Java Spring Boot course I wanted to leave a review but the review form throws a 500 error on submit." },
  { from: "isabel.fernandez@proton.me", senderName: "Isabel Fernandez", subject: "Refund - internet too slow for video content", body: "I live in a rural area and the video content will not load reliably. Requesting refund." },
  { from: "patrick.obrien@gmail.com", senderName: "Patrick OBrien", subject: "Exam timer started before I was ready", body: "The final exam for the AWS Solutions Architect course started counting down before I clicked Begin. I lost 12 minutes." },
  { from: "linda.hall@outlook.com", senderName: "Linda Hall", subject: "Mobile app notifications overwhelming", body: "I am getting push notifications every 10 minutes about course updates even though I disabled notifications in settings." },
  { from: "chris.martin@gmail.com", senderName: "Chris Martin", subject: "Code playground saving wrong file", body: "When I save my work in the interactive code playground for the Algorithms course, it saves to a different exercise." },
  { from: "natalie.king@yahoo.com", senderName: "Natalie King", subject: "Instructor accent very difficult to understand", body: "I am struggling to understand the instructor in the Database Design course. Are transcripts available?" },
  { from: "viktor.petrov@gmail.com", senderName: "Viktor Petrov", subject: "Student discount verification failing", body: "I uploaded my valid university student ID for the student discount but it keeps getting rejected." },
  { from: "susan.baker@outlook.com", senderName: "Susan Baker", subject: "Need official transcript for employer", body: "My employer requires an official transcript showing my coursework hours for the Professional Development program." },
  { from: "jason.lee@proton.me", senderName: "Jason Lee", subject: "Cohort start date changed without notice", body: "The January 2026 cohort for the Full Stack Bootcamp was silently moved to February. I arranged my schedule around the original date." },
  { from: "michelle.young@gmail.com", senderName: "Michelle Young", subject: "Payment plan installment failed", body: "My second installment payment of $199 for the Data Science bootcamp failed and now my course access is locked." },
  { from: "robert.taylor@outlook.com", senderName: "Robert Taylor", subject: "Course roadmap or learning path suggestion", body: "I completed the Python Basics course. What course should I take next? I am interested in web development and machine learning." },
  { from: "anna.schmidt@gmail.com", senderName: "Anna Schmidt", subject: "Broken image in course thumbnail", body: "The Machine Learning Fundamentals course shows a broken image icon instead of the actual thumbnail on the catalog page." },
  { from: "felix.wong@yahoo.com", senderName: "Felix Wong", subject: "Cannot join study group", body: "The Join Study Group button for the System Design course gives me an error saying the group is full, but the description says unlimited spots." },
  { from: "tamara.jones@gmail.com", senderName: "Tamara Jones", subject: "Refund - instructor changed mid-course", body: "The original instructor for the Vue.js course left and was replaced by someone with much lower teaching quality. I want a refund." },
  { from: "eric.anderson@outlook.com", senderName: "Eric Anderson", subject: "Webhook integration not sending completion events", body: "I set up a webhook to receive course completion events for my LMS but no events are being sent." },
  { from: "megan.phillips@proton.me", senderName: "Megan Phillips", subject: "Need W-9 form for tax purposes", body: "I am a course instructor and need a W-9 form from your company for my tax filing." },
  { from: "diego.morales@gmail.com", senderName: "Diego Morales", subject: "Plagiarism flag on original work", body: "My assignment in the Ethics in AI course was flagged for plagiarism but it is 100% my original work." },
  { from: "katherine.bell@outlook.com", senderName: "Katherine Bell", subject: "Cannot access course after renewal", body: "My annual subscription renewed yesterday but I still cannot access any premium courses. My payment went through." },
  { from: "anthony.russo@gmail.com", senderName: "Anthony Russo", subject: "Mentor availability not matching timezone", body: "All available mentor slots for the Backend Engineering bootcamp are between 2-6 AM in my timezone (EST)." },
  { from: "paula.cox@yahoo.com", senderName: "Paula Cox", subject: "Course completion email sent prematurely", body: "I received a congratulations email saying I completed the Graphic Design course but I still have 3 modules remaining." },
  { from: "ivan.kozlov@gmail.com", senderName: "Ivan Kozlov", subject: "Discussion post disappeared after posting", body: "I wrote a detailed response in the Week 6 discussion forum for the Philosophy of CS course and it vanished after I clicked Post." },
  { from: "wendy.chen@outlook.com", senderName: "Wendy Chen", subject: "Bulk enrollment CSV upload failing", body: "I am an HR manager trying to upload a CSV of 50 employees for the Leadership Skills course. The upload fails with no error message." },
  { from: "brandon.white@proton.me", senderName: "Brandon White", subject: "API rate limit too low for testing", body: "The API sandbox for the API Development course limits me to 10 requests per minute which is insufficient for testing pagination." },
  { from: "helen.moore@gmail.com", senderName: "Helen Moore", subject: "Refund - promised features not delivered", body: "The course description promised live coding sessions and a portfolio review. Neither has been provided in 4 weeks." },
  { from: "leo.silva@outlook.com", senderName: "Leo Silva", subject: "SSO login not working with company Google account", body: "Our company uses Google Workspace and SSO login keeps failing with a redirect_uri_mismatch error." },
  { from: "rebecca.foster@gmail.com", senderName: "Rebecca Foster", subject: "Accessibility - keyboard navigation broken", body: "I cannot navigate the course player using only keyboard. Tab key skips over the play/pause and volume controls." },
  { from: "alan.cooper@yahoo.com", senderName: "Alan Cooper", subject: "Certificate verification URL returns error", body: "When my employer tries to verify my certificate at the verification URL, they get a page not found error." },
  { from: "chloe.james@gmail.com", senderName: "Chloe James", subject: "Quiz timer too short for non-native speakers", body: "The 2-minute timer per question in the English Technical Writing course is too short for non-native English speakers." },
  { from: "martin.wolf@outlook.com", senderName: "Martin Wolf", subject: "Cannot access purchased bundle courses individually", body: "I bought the Full Stack Bundle but individual courses like React and Node show as locked." },
  { from: "nicole.price@proton.me", senderName: "Nicole Price", subject: "Course materials not ADA compliant", body: "The PDF course materials do not have proper heading structure or alt text for images." },
  { from: "trevor.hall@gmail.com", senderName: "Trevor Hall", subject: "Charged in wrong currency", body: "I am in the UK and selected GBP but was charged in USD. The amount is significantly higher due to exchange rate." },
  { from: "olivia.reed@outlook.com", senderName: "Olivia Reed", subject: "Need to merge two accounts", body: "I accidentally created two accounts with personal and work emails. I need my progress merged into one account." },
  { from: "adam.hughes@gmail.com", senderName: "Adam Hughes", subject: "Scheduled maintenance during exam window", body: "Your scheduled maintenance on Saturday overlaps with my certification exam window." },
  { from: "sophia.bennett@yahoo.com", senderName: "Sophia Bennett", subject: "Cannot use promo code", body: "The promo code SPRING2026 for 30% off says expired but the promotional email says valid until April 15." },
  { from: "george.clark@outlook.com", senderName: "George Clark", subject: "Instructor response time over 7 days", body: "I asked a question in the Q&A section of the Microservices course 9 days ago and still have no response." },
  { from: "victoria.lewis@gmail.com", senderName: "Victoria Lewis", subject: "Refund - technical requirements not listed", body: "The VR Development course requires a VR headset costing $500+ which was not mentioned in the prerequisites." },
  { from: "derek.morgan@proton.me", senderName: "Derek Morgan", subject: "Completed course missing from transcript", body: "The Cloud Architecture course I completed in January 2026 is not showing on my official transcript download." },
  { from: "carmen.ruiz@gmail.com", senderName: "Carmen Ruiz", subject: "Team dashboard not showing member progress", body: "As a team admin, the team dashboard shows 0% progress for all 12 members even though several have completed modules." },
  { from: "paul.stewart@outlook.com", senderName: "Paul Stewart", subject: "Video resolution capped at 480p", body: "All course videos in the Photography Masterclass are capped at 480p even though I have a premium subscription." },
  { from: "irene.chang@gmail.com", senderName: "Irene Chang", subject: "Wishlist courses disappeared", body: "I had 8 courses saved in my wishlist and they have all disappeared after the latest platform update." },
  { from: "tyler.brooks@yahoo.com", senderName: "Tyler Brooks", subject: "Lab credits expired before I could use them", body: "The 10 cloud lab credits for the Terraform course expired after 7 days. The course takes 4 weeks." },
  { from: "martha.powell@outlook.com", senderName: "Martha Powell", subject: "Course content same as free YouTube tutorial", body: "Large portions of the Paid Excel Advanced course are identical to the instructors free YouTube tutorials." },
  { from: "nathan.ward@gmail.com", senderName: "Nathan Ward", subject: "SSO SAML configuration help needed", body: "Our IT team is trying to configure SAML SSO for our enterprise account but the metadata endpoint returns invalid XML." },
  { from: "claire.rogers@proton.me", senderName: "Claire Rogers", subject: "Refund - course discontinued before completion", body: "The Hadoop Fundamentals course was discontinued while I was 60% through. I paid full price and cannot complete it." },
  { from: "bruce.kim@gmail.com", senderName: "Bruce Kim", subject: "Gamification badges not unlocking", body: "I have completed all Week 1 activities in the Python course but none of the achievement badges have unlocked." },
  { from: "fiona.grant@outlook.com", senderName: "Fiona Grant", subject: "Calendar sync showing wrong dates", body: "The course schedule synced to my Google Calendar shows all sessions one day ahead of the actual dates." },
  { from: "douglas.price@gmail.com", senderName: "Douglas Price", subject: "Custom learning path not saving", body: "Every time I create a custom learning path and click Save, the page refreshes and my selections are gone." },
  { from: "hazel.cook@yahoo.com", senderName: "Hazel Cook", subject: "Need interview with course graduate for article", body: "I am a tech journalist writing about online education. Could you connect me with a successful graduate for a brief interview?" },
];

async function seed() {
  let success = 0;
  let failed = 0;

  for (let i = 0; i < tickets.length; i++) {
    const ticket = tickets[i];
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ticket),
      });

      if (res.status === 201) {
        success++;
        console.log(`[${i + 1}/${tickets.length}] Created: ${ticket.subject}`);
      } else {
        failed++;
        const body = await res.json();
        console.log(`[${i + 1}/${tickets.length}] Failed (${res.status}): ${body.error}`);
      }
    } catch (err) {
      failed++;
      console.log(`[${i + 1}/${tickets.length}] Error: ${err}`);
    }
  }

  console.log(`\nDone. ${success} created, ${failed} failed out of ${tickets.length}.`);
}

seed();
