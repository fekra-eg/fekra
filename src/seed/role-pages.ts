/**
 * Role pages for every mega-menu item that had no page of its own (FK-24).
 * Each page carries its own intro and FAQ so it isn't a copy of its
 * category page (FK-26). Created by `pnpm seed:role-pages`; existing slugs
 * are left untouched.
 */

export type RolePage = {
  slug: string
  /** Category page this role sits under in the menu. */
  parent: string
  title: string
  summary: string
  body: [string, string, string]
  faqs: Array<[question: string, answer: string]>
}

export const rolePages: RolePage[] = [
  // ---------- In-Demand ----------
  {
    slug: 'hire-ai-engineers',
    parent: 'hire-ai-data-experts',
    title: 'Hire AI Engineers',
    summary: 'Add AI engineers who turn language models and machine learning into features your users actually rely on.',
    body: [
      'Hire AI engineers who can take a use case from prototype to production: retrieval-augmented generation, agents, classification, summarisation and the evaluation work that keeps them reliable.',
      'FEKRA AI engineers work with the major model APIs and open-source models, build the data pipelines and guardrails around them, and measure quality, latency and cost before anything ships.',
      'Start with one engineer to prove a use case or a small team to build an AI product line, with recruitment, onboarding, HR and ongoing support managed by FEKRA.',
    ],
    faqs: [
      ['What can a FEKRA AI engineer build for us?', 'Typical work includes AI assistants over your own documents, support and sales copilots, document extraction, classification and summarisation, and agents that call your internal APIs, each with evaluation and monitoring in place.'],
      ['Do you work with our existing data and cloud?', 'Yes. Engineers work inside your cloud account and repositories, follow your data-handling rules, and can use private or self-hosted models where data cannot leave your environment.'],
      ['What does a typical AI team look like?', 'Most clients start with one AI engineer alongside their product team. Larger initiatives usually add a data engineer for pipelines and an MLOps engineer for deployment and monitoring.'],
    ],
  },
  {
    slug: 'hire-data-engineers',
    parent: 'hire-ai-data-experts',
    title: 'Hire Data Engineers',
    summary: 'Hire data engineers who build reliable pipelines, warehouses and lakehouses your analytics and AI can trust.',
    body: [
      'Hire data engineers who design and run the pipelines that move data from your products and business systems into a warehouse or lakehouse your teams can query with confidence.',
      'FEKRA data engineers handle ingestion, modelling, orchestration, data quality and cost control, and document what they build so analysts and data scientists can work independently.',
      'Add one engineer to stabilise an existing platform or a team to build a new one, with recruitment, onboarding, HR and ongoing support handled by FEKRA.',
    ],
    faqs: [
      ['Can you take over an existing data platform?', 'Yes. Engineers start by auditing current pipelines, failure points and costs, then stabilise and document the platform before adding new sources.'],
      ['Batch or real-time?', 'Both. Most platforms combine scheduled batch loads with streaming for events that need to be fresh within seconds or minutes.'],
      ['What does a typical data team look like?', 'A common setup is one or two data engineers working with your analysts. Larger programmes add a BI developer for reporting and a data scientist for modelling.'],
    ],
  },
  {
    slug: 'hire-aws-engineers',
    parent: 'hire-devops-cloud-engineers',
    title: 'Hire AWS Engineers',
    summary: 'Hire AWS engineers who design, automate and run secure, cost-efficient infrastructure on Amazon Web Services.',
    body: [
      'Hire AWS engineers who build and operate production infrastructure on Amazon Web Services, from landing zones and networking to containers, serverless and managed databases.',
      'FEKRA AWS engineers define everything as code, apply least-privilege security, set up monitoring and alerting, and keep an eye on the monthly bill as usage grows.',
      'Bring in one engineer for a migration or a dedicated cloud team for long-term operations, with recruitment, onboarding, HR and support handled by FEKRA.',
    ],
    faqs: [
      ['Can your engineers migrate us to AWS?', 'Yes. Migrations start with an assessment of current workloads and dependencies, followed by a phased plan that keeps services running during the move.'],
      ['Do they help reduce AWS costs?', 'Cost reviews are part of the work: right-sizing, reserved capacity and savings plans, storage lifecycle rules and removing idle resources.'],
      ['What does a typical AWS team look like?', 'Many clients start with one AWS engineer embedded in their product team. Larger estates add a site reliability engineer for on-call and incident response.'],
    ],
  },
  {
    slug: 'hire-crm-developers',
    parent: 'hire-in-demand-developers',
    title: 'Hire CRM Developers',
    summary: 'Hire CRM developers who customise, integrate and automate your CRM so sales and support teams work from one source of truth.',
    body: [
      'Hire CRM developers who configure and extend platforms such as Salesforce, HubSpot, Microsoft Dynamics 365 and Zoho around the way your sales, marketing and support teams really work.',
      'FEKRA CRM developers build custom objects and workflows, integrate the CRM with your website, ERP and billing systems, and migrate data cleanly from spreadsheets or older tools.',
      'Hire one developer for a specific project or keep a specialist on your team for ongoing improvements, with recruitment, onboarding, HR and support managed by FEKRA.',
    ],
    faqs: [
      ['Which CRM platforms do you support?', 'Most requests are for Salesforce, HubSpot, Microsoft Dynamics 365 and Zoho. Tell us your platform and edition and we match developers with hands-on experience in it.'],
      ['Can you migrate our data from another system?', 'Yes. Developers map fields, clean and de-duplicate records, run test imports and reconcile totals before the final cut-over.'],
      ['What does a typical CRM engagement look like?', 'Usually one CRM developer working with your sales or operations lead, sometimes paired with a QA engineer for larger roll-outs.'],
    ],
  },
  {
    slug: 'hire-graphic-designers',
    parent: 'hire-in-demand-developers',
    title: 'Hire Graphic Designers',
    summary: 'Hire graphic designers who produce consistent, on-brand visuals for your product, marketing and social channels.',
    body: [
      'Hire graphic designers who create the visual material your business needs every week: marketing assets, social media content, presentations, brand collateral and product illustrations.',
      'FEKRA designers work from your brand guidelines, or help you build them, and deliver organised, editable source files so your team can reuse and adapt every asset.',
      'Add a designer part-time or full-time to your marketing or product team, with recruitment, onboarding, HR and ongoing support handled by FEKRA.',
    ],
    faqs: [
      ['Do designers follow our existing brand guidelines?', 'Yes. They start from your guidelines and templates. If you don’t have them yet, they can create a practical brand kit first.'],
      ['Can a designer also work on our product UI?', 'Graphic designers focus on brand and marketing visuals. For product interfaces we recommend a UI/UX designer, and we can staff both.'],
      ['How do we request and review work?', 'Designers join your usual tools such as Slack, Trello, Jira or Asana and deliver drafts for review in Figma or shared folders, usually within your working day.'],
    ],
  },
  {
    slug: 'hire-odoo-developers',
    parent: 'hire-in-demand-developers',
    title: 'Hire Odoo Developers',
    summary: 'Hire Odoo developers who customise modules, integrate systems and keep your ERP running smoothly as you grow.',
    body: [
      'Hire Odoo developers who implement and extend Odoo across sales, inventory, accounting, manufacturing, HR and e-commerce, shaped around your real business processes.',
      'FEKRA Odoo developers build custom modules, reports and automations in Python and XML, integrate Odoo with payment gateways, shipping and third-party tools, and handle version upgrades.',
      'Hire one developer for an implementation or upgrade, or keep a dedicated specialist for ongoing changes, with recruitment, onboarding, HR and support managed by FEKRA.',
    ],
    faqs: [
      ['Can you upgrade us to a newer Odoo version?', 'Yes. Developers review your custom modules, port them to the new version, migrate data in a test environment and verify each process before going live.'],
      ['Do you support e-invoicing requirements in Saudi Arabia and Egypt?', 'Developers can configure and integrate e-invoicing for ZATCA and the Egyptian Tax Authority using Odoo’s localisation modules or custom integrations.'],
      ['What does a typical Odoo team look like?', 'Most clients work with one Odoo developer and a functional contact on their side. Larger implementations add a second developer and a QA engineer.'],
    ],
  },
  {
    slug: 'hire-blockchain-developers',
    parent: 'hire-in-demand-developers',
    title: 'Hire Blockchain Developers',
    summary: 'Hire blockchain developers who build secure smart contracts and the applications around them.',
    body: [
      'Hire blockchain developers who design, write and test smart contracts and connect them to web and mobile applications your users can actually use.',
      'FEKRA blockchain developers focus on security first: well-tested contracts, established libraries, clear upgrade paths and preparation for independent audits.',
      'Add one developer to an existing product team or build a small team for a new platform, with recruitment, onboarding, HR and support handled by FEKRA.',
    ],
    faqs: [
      ['Do your developers audit smart contracts?', 'They write thorough tests and follow established security practices, and prepare contracts for review. For high-value contracts we recommend an additional independent audit firm.'],
      ['Which networks do you work with?', 'Most work is on Ethereum and EVM-compatible networks such as Polygon, BNB Chain and Layer 2s. Tell us your target network and we match accordingly.'],
      ['What does a typical blockchain team look like?', 'Usually one smart-contract developer plus a full-stack developer for the application, with a QA engineer added before launch.'],
    ],
  },

  // ---------- Front-end ----------
  {
    slug: 'hire-typescript-developers',
    parent: 'hire-front-end-developers',
    title: 'Hire TypeScript Developers',
    summary: 'Hire TypeScript developers who write typed, maintainable code across your front end and back end.',
    body: [
      'Hire TypeScript developers who bring type safety to your web applications, catching bugs at build time and making large codebases easier to change.',
      'FEKRA TypeScript developers work across React, Angular, Next.js and Node.js, design clear shared types between front end and API, and can migrate existing JavaScript projects step by step.',
      'Add one developer to your team or a full squad, with recruitment, onboarding, HR and ongoing support managed by FEKRA.',
    ],
    faqs: [
      ['Can you migrate our JavaScript code to TypeScript?', 'Yes. Developers migrate gradually, file by file, so the product keeps shipping while type coverage grows.'],
      ['Front end, back end or both?', 'Both. Many FEKRA TypeScript developers work full-stack with React or Next.js on the front end and Node.js or NestJS on the back end.'],
      ['What does a typical team look like?', 'Common setups are one or two TypeScript developers in your product team, or a squad of three to five with a QA engineer.'],
    ],
  },

  // ---------- Back-end ----------
  {
    slug: 'hire-java-developers',
    parent: 'hire-back-end-developers',
    title: 'Hire Java Developers',
    summary: 'Hire Java developers who build secure, high-performance back-end systems for enterprise and product teams.',
    body: [
      'Hire Java developers who build and maintain the back-end systems your business depends on: APIs, transaction processing, integrations and long-running enterprise applications.',
      'FEKRA Java developers write clean, tested code on modern Java versions, work with microservices and messaging, and are comfortable modernising older Java applications without disrupting operations.',
      'Add one developer or a complete back-end team, with recruitment, onboarding, HR and ongoing support handled by FEKRA.',
    ],
    faqs: [
      ['Can your developers modernise a legacy Java application?', 'Yes. They typically upgrade the Java and framework versions first, add tests around critical flows, then split out services where it brings a clear benefit.'],
      ['Do you have Java developers with banking or fintech experience?', 'Yes. Tell us your domain and compliance requirements and we shortlist developers who have worked in similar environments.'],
      ['What does a typical Java team look like?', 'Often two or three Java developers with a QA engineer. Larger systems add a DevOps engineer for build and deployment pipelines.'],
    ],
  },
  {
    slug: 'hire-spring-boot-developers',
    parent: 'hire-back-end-developers',
    title: 'Hire Spring Boot Developers',
    summary: 'Hire Spring Boot developers who build production-ready microservices and APIs quickly and safely.',
    body: [
      'Hire Spring Boot developers who build REST APIs and microservices that are secure, observable and ready for production from day one.',
      'FEKRA Spring Boot developers use the wider Spring ecosystem, including Spring Security, Spring Data and Spring Cloud, and package services in containers for consistent deployment.',
      'Hire one developer to extend an existing service or a team to build a new platform, with recruitment, onboarding, HR and support managed by FEKRA.',
    ],
    faqs: [
      ['Can you help us move from a monolith to microservices?', 'Yes. Developers identify clear service boundaries, extract them one at a time and keep the monolith running until each part is safely replaced.'],
      ['How do you handle security in Spring Boot services?', 'Developers use Spring Security with OAuth 2.0 or OpenID Connect, validate all input, manage secrets outside the code and keep dependencies patched.'],
      ['What does a typical Spring Boot team look like?', 'Usually two to four back-end developers with a QA engineer, plus a DevOps engineer when the platform runs on Kubernetes.'],
    ],
  },
  {
    slug: 'hire-golang-developers',
    parent: 'hire-back-end-developers',
    title: 'Hire Golang Developers',
    summary: 'Hire Go developers who build fast, efficient services and infrastructure tooling that scale with your traffic.',
    body: [
      'Hire Golang developers who build high-throughput APIs, microservices and platform tools where performance, low memory use and simple deployment matter.',
      'FEKRA Go developers write idiomatic, well-tested code, use concurrency safely, and are comfortable working with gRPC, message queues and cloud-native infrastructure.',
      'Add one Go developer to your back-end team or a dedicated squad, with recruitment, onboarding, HR and ongoing support handled by FEKRA.',
    ],
    faqs: [
      ['When is Go a good choice?', 'Go suits services that handle heavy traffic, need low latency or run as small, fast containers, as well as internal tooling and infrastructure software.'],
      ['Can Go developers rewrite part of our existing system?', 'Yes. A common approach is to move one performance-critical service to Go first, measure the gain, then decide on the next step.'],
      ['What does a typical Go team look like?', 'Often one or two Go developers working alongside your existing back-end team, with a DevOps engineer for Kubernetes-based platforms.'],
    ],
  },

  // ---------- Full-stack ----------
  {
    slug: 'hire-java-full-stack-developers',
    parent: 'hire-full-stack-developers',
    title: 'Hire Java Full-Stack Developers',
    summary: 'Hire Java full-stack developers who own features end to end, from Spring Boot APIs to modern front ends.',
    body: [
      'Hire Java full-stack developers who can take a feature from database to user interface, combining a Spring Boot back end with a React or Angular front end.',
      'FEKRA Java full-stack developers design the API and the screens together, write tests on both sides, and reduce hand-offs between separate front-end and back-end teams.',
      'Hire an individual developer or a cross-functional team, with recruitment, onboarding, HR and support managed by FEKRA.',
    ],
    faqs: [
      ['React or Angular?', 'Both are available. Tell us which framework your product uses and we shortlist developers with production experience in it.'],
      ['Is a full-stack developer as strong as two specialists?', 'For most product features, yes, and with fewer hand-offs. For very complex front ends or high-scale back ends, we recommend adding a specialist.'],
      ['What does a typical team look like?', 'Two or three Java full-stack developers with a QA engineer is a common setup for a product team.'],
    ],
  },
  {
    slug: 'hire-dotnet-full-stack-developers',
    parent: 'hire-full-stack-developers',
    title: 'Hire .NET Full-Stack Developers',
    summary: 'Hire .NET full-stack developers who build complete web applications with ASP.NET Core and modern front ends.',
    body: [
      'Hire .NET full-stack developers who build complete web applications, combining ASP.NET Core APIs with Angular, React or Blazor front ends.',
      'FEKRA .NET full-stack developers work with Entity Framework, SQL Server and Azure, and can modernise older .NET Framework applications to current .NET versions.',
      'Hire one developer or a full team, with recruitment, onboarding, HR and ongoing support handled by FEKRA.',
    ],
    faqs: [
      ['Can you upgrade our .NET Framework application?', 'Yes. Developers assess dependencies, upgrade to a current .NET version in stages and keep the application running throughout.'],
      ['Do your developers work with Azure?', 'Yes. Most .NET full-stack developers have deployed to Azure App Service, Azure SQL and Azure DevOps pipelines.'],
      ['What does a typical team look like?', 'Two or three .NET full-stack developers with a QA engineer, adding a DevOps engineer for larger Azure environments.'],
    ],
  },
  {
    slug: 'hire-python-full-stack-developers',
    parent: 'hire-full-stack-developers',
    title: 'Hire Python Full-Stack Developers',
    summary: 'Hire Python full-stack developers who ship complete products with Django or FastAPI and modern front ends.',
    body: [
      'Hire Python full-stack developers who build complete web products, pairing Django or FastAPI back ends with React or Vue front ends.',
      'FEKRA Python full-stack developers move quickly from idea to working product, and are well placed for products that combine web features with data processing or AI.',
      'Add one developer or a small product team, with recruitment, onboarding, HR and support managed by FEKRA.',
    ],
    faqs: [
      ['Django or FastAPI?', 'Django suits content-rich applications with an admin panel; FastAPI suits fast, API-first services. Developers can advise based on your product.'],
      ['Can they also add AI features?', 'Yes. Python makes it straightforward to integrate model APIs and data processing, and we can add an AI engineer for larger AI work.'],
      ['What does a typical team look like?', 'Often one or two Python full-stack developers for an MVP, growing to three to five with a QA engineer as the product matures.'],
    ],
  },

  // ---------- AI & Data ----------
  {
    slug: 'hire-machine-learning-engineers',
    parent: 'hire-ai-data-experts',
    title: 'Hire Machine Learning Engineers',
    summary: 'Hire machine learning engineers who build, train and deploy models that improve real business decisions.',
    body: [
      'Hire machine learning engineers who turn your data into models for forecasting, recommendations, risk scoring, classification and anomaly detection.',
      'FEKRA ML engineers handle the full cycle: feature engineering, training, evaluation, deployment and monitoring, so models keep performing after launch.',
      'Add one engineer to your data team or build a dedicated ML squad, with recruitment, onboarding, HR and support handled by FEKRA.',
    ],
    faqs: [
      ['How do we know a model is worth building?', 'Engineers start with a baseline and a clear success metric, so you can see the expected business impact before investing in a full build.'],
      ['Who maintains models after launch?', 'The same engineers set up monitoring for data drift and accuracy and retrain models on a schedule or when performance drops.'],
      ['What does a typical ML team look like?', 'One ML engineer with a data engineer is a common start. Larger programmes add an MLOps engineer and a data scientist.'],
    ],
  },
  {
    slug: 'hire-data-scientists',
    parent: 'hire-ai-data-experts',
    title: 'Hire Data Scientists',
    summary: 'Hire data scientists who find the answers in your data and turn them into decisions and models.',
    body: [
      'Hire data scientists who analyse your data to explain what is happening in your business, test ideas with experiments and build predictive models where they add value.',
      'FEKRA data scientists combine statistics, programming and clear communication, presenting findings in a way product, finance and leadership teams can act on.',
      'Add a data scientist to your analytics team or for a specific project, with recruitment, onboarding, HR and ongoing support managed by FEKRA.',
    ],
    faqs: [
      ['What is the difference between a data scientist and an ML engineer?', 'Data scientists focus on analysis, experiments and model prototypes; ML engineers focus on deploying and running models in production. Many projects benefit from both.'],
      ['Can a data scientist work with messy data?', 'Yes. Cleaning and understanding data is a normal part of the work, and they will flag data issues that need fixing at the source.'],
      ['What does a typical setup look like?', 'Often one data scientist working with your analysts or product team, supported by a data engineer for pipelines.'],
    ],
  },
  {
    slug: 'hire-mlops-engineers',
    parent: 'hire-ai-data-experts',
    title: 'Hire MLOps Engineers',
    summary: 'Hire MLOps engineers who take models from notebooks to reliable, monitored production systems.',
    body: [
      'Hire MLOps engineers who build the infrastructure that lets your team train, deploy, monitor and update machine learning and AI models reliably.',
      'FEKRA MLOps engineers set up model registries, automated training and deployment pipelines, serving infrastructure and monitoring for drift, latency and cost.',
      'Add one engineer to support your data science team or a dedicated platform team, with recruitment, onboarding, HR and support handled by FEKRA.',
    ],
    faqs: [
      ['When do we need MLOps?', 'Once you have more than one model in production, or a model that needs regular retraining, MLOps saves time and prevents silent failures.'],
      ['Do you support LLM applications too?', 'Yes. MLOps engineers also deploy and monitor LLM-based features, including prompt versioning, evaluation runs and cost tracking.'],
      ['What does a typical team look like?', 'One MLOps engineer usually supports two to five data scientists or ML engineers.'],
    ],
  },
  {
    slug: 'hire-nlp-engineers',
    parent: 'hire-ai-data-experts',
    title: 'Hire NLP Engineers',
    summary: 'Hire NLP engineers who build search, chat and text-understanding features in English, Arabic and more.',
    body: [
      'Hire NLP engineers who build features that understand text: search, chatbots, document extraction, classification, sentiment analysis and summarisation.',
      'FEKRA NLP engineers work with both large language models and classic NLP techniques, and have experience with Arabic as well as English text.',
      'Add one engineer to your product team or a small NLP squad, with recruitment, onboarding, HR and ongoing support handled by FEKRA.',
    ],
    faqs: [
      ['Do your NLP engineers work with Arabic?', 'Yes. Several engineers have built Arabic search, classification and chat features and understand dialect and script challenges.'],
      ['LLMs or classic NLP?', 'It depends on accuracy, cost and latency needs. Engineers often combine both, using smaller models for high-volume tasks and LLMs where reasoning is needed.'],
      ['What does a typical team look like?', 'Usually one NLP engineer with a back-end developer for integration, adding a data engineer when large text collections are involved.'],
    ],
  },
  {
    slug: 'hire-computer-vision-engineers',
    parent: 'hire-ai-data-experts',
    title: 'Hire Computer Vision Engineers',
    summary: 'Hire computer vision engineers who build image and video recognition that works in real-world conditions.',
    body: [
      'Hire computer vision engineers who build systems that detect, classify and track objects in images and video, read documents and inspect quality.',
      'FEKRA computer vision engineers handle data collection and labelling, model training and optimisation, and deployment to the cloud or to edge devices.',
      'Add one engineer for a proof of concept or a team for a production system, with recruitment, onboarding, HR and support handled by FEKRA.',
    ],
    faqs: [
      ['How much data do we need?', 'It varies by task. Engineers often start with pre-trained models and a few hundred labelled examples, then grow the dataset as needed.'],
      ['Can models run on cameras or devices on site?', 'Yes. Engineers optimise models for edge hardware when processing must happen locally for speed or privacy.'],
      ['What does a typical team look like?', 'One computer vision engineer for a proof of concept, growing to two plus an MLOps engineer for production systems.'],
    ],
  },
  {
    slug: 'hire-bi-developers',
    parent: 'hire-ai-data-experts',
    title: 'Hire BI Developers',
    summary: 'Hire BI developers who build dashboards and reports your teams trust and actually use.',
    body: [
      'Hire BI developers who turn your data into clear dashboards and reports for leadership, finance, sales and operations.',
      'FEKRA BI developers model data properly, define consistent metrics, automate report refreshes and set up access so each team sees the right numbers.',
      'Add a BI developer to your team or for a reporting project, with recruitment, onboarding, HR and ongoing support managed by FEKRA.',
    ],
    faqs: [
      ['Power BI or Tableau?', 'Both are available. If you already use Microsoft 365, Power BI is often the simplest choice; we match developers to your tool.'],
      ['Can you replace our manual Excel reports?', 'Yes. Developers connect directly to your systems, automate the refresh and keep the formats your teams are used to where it helps.'],
      ['What does a typical setup look like?', 'Usually one BI developer, working with a data engineer if your data needs to be consolidated first.'],
    ],
  },

  // ---------- Mobile ----------
  {
    slug: 'hire-kotlin-developers',
    parent: 'hire-mobile-app-developers',
    title: 'Hire Kotlin Developers',
    summary: 'Hire Kotlin developers who build modern, high-quality native Android apps.',
    body: [
      'Hire Kotlin developers who build native Android apps with smooth performance, modern design and full access to device features.',
      'FEKRA Kotlin developers use Jetpack Compose and current Android architecture guidance, write tested code and handle Play Store releases.',
      'Add one developer to your mobile team or a complete Android squad, with recruitment, onboarding, HR and support managed by FEKRA.',
    ],
    faqs: [
      ['Can you move our Java Android app to Kotlin?', 'Yes. Kotlin works alongside Java, so developers migrate screens gradually while the app keeps shipping.'],
      ['Native Kotlin or cross-platform?', 'Native Kotlin gives the best Android performance and access to new platform features. If you need both iOS and Android from one codebase, we also staff Flutter and React Native developers.'],
      ['What does a typical team look like?', 'One or two Android developers alongside an iOS developer and a QA engineer for mobile testing.'],
    ],
  },
  {
    slug: 'hire-swift-developers',
    parent: 'hire-mobile-app-developers',
    title: 'Hire Swift Developers',
    summary: 'Hire Swift developers who build polished, native iOS apps that feel right on Apple devices.',
    body: [
      'Hire Swift developers who build native iOS apps with the performance, accessibility and polish Apple users expect.',
      'FEKRA Swift developers use SwiftUI and UIKit, follow Apple’s design guidelines and handle App Store submission and review.',
      'Add one developer to your mobile team or a full iOS squad, with recruitment, onboarding, HR and ongoing support handled by FEKRA.',
    ],
    faqs: [
      ['SwiftUI or UIKit?', 'New screens are usually built in SwiftUI; developers also maintain and extend UIKit code in existing apps.'],
      ['Do you handle App Store releases?', 'Yes. Developers prepare builds, manage TestFlight testing and respond to App Store review feedback.'],
      ['What does a typical team look like?', 'One or two iOS developers alongside an Android developer and a QA engineer for mobile testing.'],
    ],
  },

  // ---------- QA ----------
  {
    slug: 'hire-sdet-engineers',
    parent: 'hire-qa-engineers',
    title: 'Hire SDET Engineers',
    summary: 'Hire SDETs who build the test frameworks and automation that let your team release with confidence.',
    body: [
      'Hire software development engineers in test (SDETs) who write code to test code: test frameworks, automated suites and the tooling that runs them in your pipeline.',
      'FEKRA SDETs work closely with developers, add tests at the right level, from unit to end-to-end, and keep suites fast and stable so failures mean real problems.',
      'Add one SDET to your team or build a quality engineering function, with recruitment, onboarding, HR and support managed by FEKRA.',
    ],
    faqs: [
      ['How is an SDET different from an automation QA engineer?', 'SDETs have stronger development skills: they design frameworks, contribute to the product codebase and build test tooling, not only automated scripts.'],
      ['Can an SDET fix our flaky tests?', 'Yes. Stabilising and speeding up existing suites is often the first piece of work.'],
      ['What does a typical setup look like?', 'One SDET usually supports one or two development squads, often paired with a manual QA engineer for exploratory testing.'],
    ],
  },
  {
    slug: 'hire-performance-test-engineers',
    parent: 'hire-qa-engineers',
    title: 'Hire Performance Test Engineers',
    summary: 'Hire performance test engineers who find bottlenecks before your users and peak traffic do.',
    body: [
      'Hire performance test engineers who check how your systems behave under load, find bottlenecks and confirm you are ready for launches and seasonal peaks.',
      'FEKRA performance engineers design realistic load scenarios, run load, stress and soak tests, and work with developers to pinpoint and fix the cause of slowdowns.',
      'Bring in an engineer before a major release or keep one on your team for continuous testing, with recruitment, onboarding, HR and support handled by FEKRA.',
    ],
    faqs: [
      ['When should we run performance tests?', 'Before major launches, marketing campaigns and seasonal peaks, and ideally as a regular check in your delivery pipeline.'],
      ['Do you help fix the problems you find?', 'Engineers identify the root cause with developers, whether it’s a slow query, a missing cache or an infrastructure limit, and re-test after the fix.'],
      ['What does a typical engagement look like?', 'Often one performance engineer for four to eight weeks ahead of a launch, or part-time as an ongoing service.'],
    ],
  },
  {
    slug: 'hire-mobile-qa-engineers',
    parent: 'hire-qa-engineers',
    title: 'Hire Mobile QA Engineers',
    summary: 'Hire mobile QA engineers who test your apps across real devices, OS versions and network conditions.',
    body: [
      'Hire mobile QA engineers who make sure your iOS and Android apps work across the devices, screen sizes and operating system versions your customers use.',
      'FEKRA mobile QA engineers combine manual exploratory testing with automation, test on real devices and device clouds, and check behaviour on slow or unstable networks.',
      'Add one QA engineer to your mobile team or a full testing squad, with recruitment, onboarding, HR and ongoing support managed by FEKRA.',
    ],
    faqs: [
      ['Do you test Arabic and right-to-left layouts?', 'Yes. Mobile QA engineers check RTL layouts, Arabic text rendering and localisation on both iOS and Android.'],
      ['Manual or automated?', 'Both. Automation covers repetitive regression checks, while manual testing finds usability and edge-case issues.'],
      ['What does a typical setup look like?', 'One mobile QA engineer usually supports one iOS and one Android developer.'],
    ],
  },
  {
    slug: 'hire-api-test-engineers',
    parent: 'hire-qa-engineers',
    title: 'Hire API Test Engineers',
    summary: 'Hire API test engineers who make sure your services and integrations behave correctly and securely.',
    body: [
      'Hire API test engineers who check that your APIs return the right data, handle errors properly and stay compatible as your services and partners change.',
      'FEKRA API test engineers build automated suites for functional, contract and basic security testing, and run them on every change in your delivery pipeline.',
      'Add one engineer to your back-end team or as part of a QA function, with recruitment, onboarding, HR and support handled by FEKRA.',
    ],
    faqs: [
      ['Why test APIs separately from the UI?', 'API tests are faster and more stable than UI tests, and catch integration problems earlier, before they reach users or partners.'],
      ['Do you test third-party integrations?', 'Yes. Engineers test your side of payment, shipping and partner integrations, often using mocks and contract tests so external outages don’t block you.'],
      ['What does a typical setup look like?', 'One API test engineer usually covers a back-end team of three to six developers.'],
    ],
  },

  // ---------- DevOps & Cloud ----------
  {
    slug: 'hire-devops-engineers',
    parent: 'hire-devops-cloud-engineers',
    title: 'Hire DevOps Engineers',
    summary: 'Hire DevOps engineers who automate builds, deployments and infrastructure so your team ships faster and safer.',
    body: [
      'Hire DevOps engineers who automate the path from code to production: CI/CD pipelines, infrastructure as code, environments and monitoring.',
      'FEKRA DevOps engineers shorten release cycles, reduce manual steps and outages, and give developers self-service environments without giving up security.',
      'Add one engineer to your team or a dedicated platform squad, with recruitment, onboarding, HR and support managed by FEKRA.',
    ],
    faqs: [
      ['Where does a DevOps engineer usually start?', 'With an assessment of how code gets to production today, then automating the slowest or riskiest steps first.'],
      ['Which clouds do you support?', 'AWS, Azure and Google Cloud, as well as on-premise and hybrid environments.'],
      ['What does a typical setup look like?', 'One DevOps engineer often supports two to four development squads.'],
    ],
  },
  {
    slug: 'hire-cloud-engineers',
    parent: 'hire-devops-cloud-engineers',
    title: 'Hire Cloud Engineers',
    summary: 'Hire cloud engineers who design, migrate and run secure infrastructure on AWS, Azure and Google Cloud.',
    body: [
      'Hire cloud engineers who design and run the infrastructure behind your products, whether you are moving to the cloud, expanding or bringing costs under control.',
      'FEKRA cloud engineers build secure networks and accounts, automate infrastructure with code, plan migrations and set up backup, monitoring and disaster recovery.',
      'Add one engineer for a migration or a dedicated cloud team, with recruitment, onboarding, HR and ongoing support handled by FEKRA.',
    ],
    faqs: [
      ['Can you help choose a cloud provider?', 'Yes. Engineers compare options based on your workloads, compliance needs, team skills and data-residency requirements, including regional cloud regions in the Gulf.'],
      ['Do you handle data-residency requirements?', 'Engineers design deployments that keep data in the required region and document the controls for your compliance team.'],
      ['What does a typical setup look like?', 'One or two cloud engineers for a migration, then one engineer for ongoing operations.'],
    ],
  },
  {
    slug: 'hire-azure-engineers',
    parent: 'hire-devops-cloud-engineers',
    title: 'Hire Azure Engineers',
    summary: 'Hire Azure engineers who build and run secure, well-governed infrastructure on Microsoft Azure.',
    body: [
      'Hire Azure engineers who design and operate your Microsoft Azure environment, from landing zones and identity to containers, databases and networking.',
      'FEKRA Azure engineers automate infrastructure with Bicep or Terraform, integrate with Microsoft Entra ID and Microsoft 365, and keep governance and costs under control.',
      'Add one engineer or a dedicated cloud team, with recruitment, onboarding, HR and support managed by FEKRA.',
    ],
    faqs: [
      ['Can you migrate on-premise servers to Azure?', 'Yes. Engineers assess workloads, plan the migration in waves and set up hybrid connectivity while the move is in progress.'],
      ['Do your engineers work with Microsoft 365 and Entra ID?', 'Yes. Identity, single sign-on and access policies are a standard part of most Azure engagements.'],
      ['What does a typical setup look like?', 'One Azure engineer is common for ongoing operations, with a second during migrations or major projects.'],
    ],
  },
  {
    slug: 'hire-google-cloud-engineers',
    parent: 'hire-devops-cloud-engineers',
    title: 'Hire Google Cloud Engineers',
    summary: 'Hire Google Cloud engineers who build scalable infrastructure and data platforms on GCP.',
    body: [
      'Hire Google Cloud engineers who design and run your infrastructure on GCP, from projects, networking and identity to Kubernetes, serverless and data services.',
      'FEKRA Google Cloud engineers automate everything as code, run GKE clusters well and build data platforms on BigQuery when analytics is part of the plan.',
      'Add one engineer or a dedicated cloud team, with recruitment, onboarding, HR and ongoing support handled by FEKRA.',
    ],
    faqs: [
      ['Can you migrate us to Google Cloud?', 'Yes. Engineers plan and run migrations in stages, from other clouds or on-premise environments.'],
      ['Do they also work with BigQuery?', 'Yes. Many Google Cloud engineers set up BigQuery and the pipelines feeding it, often alongside a data engineer.'],
      ['What does a typical setup look like?', 'One Google Cloud engineer for ongoing operations, plus a data engineer when analytics is a major workload.'],
    ],
  },
  {
    slug: 'hire-site-reliability-engineers',
    parent: 'hire-devops-cloud-engineers',
    title: 'Hire Site Reliability Engineers',
    summary: 'Hire site reliability engineers who keep your services fast, available and recoverable.',
    body: [
      'Hire site reliability engineers (SREs) who keep your production systems available and fast, and help your team respond calmly when something goes wrong.',
      'FEKRA SREs define service-level objectives, build monitoring and alerting that point to real problems, automate recovery and lead blameless post-incident reviews.',
      'Add one SRE or a reliability team, with recruitment, onboarding, HR and support managed by FEKRA.',
    ],
    faqs: [
      ['Can your SREs join our on-call rotation?', 'Yes. On-call coverage and response times are agreed upfront, including coverage across time zones where needed.'],
      ['How is SRE different from DevOps?', 'DevOps focuses on how software is built and delivered; SRE focuses on how it runs in production, measured against agreed reliability targets.'],
      ['What does a typical setup look like?', 'One SRE for a small platform, growing to a rotation of two to four for round-the-clock coverage.'],
    ],
  },
  {
    slug: 'hire-platform-engineers',
    parent: 'hire-devops-cloud-engineers',
    title: 'Hire Platform Engineers',
    summary: 'Hire platform engineers who build internal platforms that let your developers ship on their own.',
    body: [
      'Hire platform engineers who build your internal developer platform: standard templates, self-service environments, and paved roads from code to production.',
      'FEKRA platform engineers reduce the repeated infrastructure work in each team, so developers spend their time on product features while security and standards are built in.',
      'Add one engineer or a platform team, with recruitment, onboarding, HR and ongoing support handled by FEKRA.',
    ],
    faqs: [
      ['When do we need platform engineering?', 'Usually once you have several product teams each solving the same infrastructure problems in different ways.'],
      ['Will developers have to learn new tools?', 'The goal is the opposite: a platform should hide complexity behind simple templates and commands your developers already understand.'],
      ['What does a typical setup look like?', 'A platform team of two to three engineers commonly supports five or more product squads.'],
    ],
  },
  {
    slug: 'hire-kubernetes-engineers',
    parent: 'hire-devops-cloud-engineers',
    title: 'Hire Kubernetes Engineers',
    summary: 'Hire Kubernetes engineers who run secure, efficient container platforms in the cloud or on-premise.',
    body: [
      'Hire Kubernetes engineers who design, run and upgrade container platforms, on EKS, AKS, GKE or your own servers.',
      'FEKRA Kubernetes engineers set up GitOps deployments, autoscaling, network policies and observability, and keep clusters patched and right-sized.',
      'Add one engineer or a dedicated platform team, with recruitment, onboarding, HR and support managed by FEKRA.',
    ],
    faqs: [
      ['Can you move our applications to Kubernetes?', 'Yes. Engineers containerise applications, set up deployment pipelines and migrate services one at a time.'],
      ['Do you handle cluster upgrades?', 'Yes. Engineers plan and test upgrades in a staging cluster first, so production upgrades are routine rather than risky.'],
      ['What does a typical setup look like?', 'One Kubernetes engineer for a single platform, often within a wider DevOps or platform team.'],
    ],
  },
]
