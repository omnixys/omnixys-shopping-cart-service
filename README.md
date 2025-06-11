# 🛍️ Omnixys Shopping Cart Service

**omnixys-shopping-cart-service** ist ein eigenständiger Microservice innerhalb der OmnixysSphere-Plattform. Er verwaltet temporäre Warenkörbe für Benutzer und ermöglicht das Hinzufügen, Entfernen, Aktualisieren und Bestellen von Artikeln – vollständig abgesichert über Keycloak und integriert in das Event-Streaming mit Kafka.

---

## 🔍 Überblick

> *Modular Thinking. Infinite Possibilities.*

Dieser Service ist zuständig für die vollständige Verwaltung eines Benutzer-Warenkorbs – mit Fokus auf Konsistenz, Sicherheit und Echtzeit-Fähigkeit. Die gesamte Kommunikation erfolgt **GraphQL-basiert**. Events werden via **Kafka** übertragen, Logging und Tracing erfolgen über **LoggerPlus** und **OpenTelemetry**.

---

## ⚙️ Tech Stack

* **Sprache**: TypeScript
* **Framework**: NestJS
* **GraphQL**: Code-First mit Apollo
* **Authentifizierung**: Keycloak
* **Datenbank**: PostgreSQL
* **Eventing**: Apache Kafka (via Confluent/NestJS Module)
* **Observability**: OpenTelemetry (Tempo), Prometheus, Grafana, Loki
* **Logging**: JSON-basiert via LoggerPlus + Kafka-LogEvents

---

## 🧹 Features

* 🧺 Erstellen und Löschen von Warenkörben
* ➕ Hinzufügen und Entfernen von Artikeln
* 📝 Aktualisieren von Mengen und Varianten
* ✅ Checkout mit Kafka-Event „order.requested“
* 🔐 Rollenbasierte Autorisierung mit Keycloak (Admin, Helfer, Benutzer)
* 📦 Kafka Topics: `create_shopping_cart`, `delete_shopping_cart`, `cart.ordered`
* 🧠 Tracing & Logging: `LoggerPlus`, `TraceContext`, `OpenTelemetry`

---

## 🚀 Lokaler Start

```bash
npm install
npm run start:dev
```

Für Docker:

```bash
docker-compose up
```

---

## 📬 GraphQL-Endpunkt

```text
http://localhost:7101/graphql
```

---

## 📤 Kafka Events

| Topic                  | Beschreibung                              |
| ---------------------- | ----------------------------------------- |
| create\_shopping\_cart | Erstellt neuen Warenkorb                  |
| delete\_shopping\_cart | Löscht bestehenden Warenkorb              |
| cart.ordered           | Wird bei erfolgreichem Checkout ausgelöst |

---

## 📁 Repository-Struktur

```
src/
├── dto/
├── resolvers/
├── services/
├── kafka/
├── utils/
├── main.ts
```

---

## 🧪 Tests

```bash
npm run test
```

Tools: Jest, ESLint, Prettier, SonarCloud

---

## 🤝 Mitwirken

Siehe [CONTRIBUTING.md](./CONTRIBUTING.md) für den Beitrag-Workflow, Branch-Namen und PR-Richtlinien.

---

## 📜 Lizenz

Lizensiert unter der [GNU GPL v3.0](./LICENSE).
© 2025 Omnixys – The Fabric of Modular Innovation.
