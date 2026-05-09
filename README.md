## 🏗 Architecture & Guidelines (AI Context)

This project implements a **Resilient Reactive Notification System with Guaranteed Delivery** using strict **Domain-Driven Design (DDD)** and **Hexagonal Architecture**.

### 1. Core Architectural Rules (MUST FOLLOW)
* **Dependency Rule:** Dependencies must ONLY point inward. `Presentation` & `Infrastructure` -> `Application` -> `Domain`.
* **Domain Layer:** Pure TypeScript ONLY. Absolutely NO framework imports (no `@nestjs/common`, no `@prisma/client`). Contains Entities, Enums, and interface definitions (Ports).
* **Application Layer:** Contains Use Cases. Orchestrates business logic using Domain Entities and interacts with the outside world ONLY via Interfaces (Ports).
* **Infrastructure Layer:** Implementation of interfaces (Adapters). This is the ONLY place where Prisma Client, RabbitMQ connections, or Redis logic should exist.
* **Presentation Layer:** Entry points to the system. Contains REST Controllers, RabbitMQ Event Consumers, and Socket.io Gateways.

### 2. Directory Structure (`src/modules/notifications/`)
```text
notifications/
├── domain/                  # Pure TS: Entities, Enums, Repository Interfaces
├── application/             # Use Cases, Application Services
├── infrastructure/          # Prisma Repositories, Message Brokers
├── presentation/            # WebSockets (Gateway), HTTP, RabbitMQ Consumers
└── notifications.module.ts  # DI Container & Wiring
```
### 3. Data Flow & Guaranteed Delivery Lifecycle
Trigger: Event arrives via RabbitMQ notification_created queue.

Consume: NotificationConsumer (Presentation) receives the payload and calls ProcessNewNotificationUseCase (Application).

Persist: The Use Case instantiates a NotificationEntity (Domain) with status PENDING and saves it via INotificationRepository.

Attempt Delivery: The Use Case calls NotificationGateway.send().

Acknowledge (ACK): The React frontend MUST emit an ack event upon receiving the socket message.

Complete: The Gateway listens for the ack, calls AcknowledgeNotificationUseCase, which updates the entity status to DELIVERED in the database.

### 4. Tech Stack Context
Backend: NestJS, TypeScript

Database: PostgreSQL via Prisma ORM

Message Broker: RabbitMQ (@nestjs/microservices)

Real-time: Socket.io