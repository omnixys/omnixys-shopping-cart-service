/**
 * Zentrale Konfiguration aller Kafka-Topics im System.
 * Dient der Typsicherheit, Übersichtlichkeit und Wiederverwendbarkeit in Publishern und Handlern.
 */

export const KafkaTopics = {
    person: {
        create: 'shopping-cart.create.person',
        delete: 'shopping-cart.delete.person',
    },
    orchestrator: {
        shutdown: 'shopping-cart.shutdown.orchestrator',
        start: "shopping-cart.start.orchestrator",
        restart:  "shopping-cart.restart.orchestrator",

        all: {
            shutdown: "all.shutdown.orchestrator",
            start: "all.start.orchestrator",
            restart: "all.restart.orchestrator",
        }
    },
    notification: {
        create: 'notification.create.shopping-cart',
        update: 'notification.update.shopping-cart',
        delete: 'notification.delete.shopping-cart',
    },
    logStream: {
        log: 'log-stream.log.shopping-cart',
    },
    inventory: {
        reserve: 'inventory.reserve-item.shopping-cart',
        release: 'inventory.release-item.shopping-cart',
    }
} as const;

/**
 * Type-safe Zugriff auf Topic-Namen.
 * Beispiel: `KafkaTopics.ShoppingCart.CustomerDeleted`
 */
export type KafkaTopicsType = typeof KafkaTopics;

/**
 * Hilfsfunktion zur Auflistung aller konfigurierten Topic-Namen (z. B. für Subscriptions).
 */
export function getAllKafkaTopics(): string[] {
    const flatten = (obj: any): string[] =>
        Object.values(obj).flatMap((value) =>
            typeof value === 'string' ? [value] : flatten(value)
        );
    return flatten(KafkaTopics);
}

/**
 * Gibt alle Kafka-Topics zurück, optional gefiltert nach Top-Level-Kategorien.
 * @param keys z.B. ['ShoppingCart', 'Notification']
 */
export function getKafkaTopicsBy(keys: string[]): string[] {
    const result: string[] = [];
    for (const key of keys) {
        const section = (KafkaTopics as Record<string, any>)[key];
        if (section && typeof section === 'object') {
            for (const topic of Object.values(section)) {
                if (typeof topic === 'string') {
                    result.push(topic);
                }
            }
        }
    }
    return result;
}
