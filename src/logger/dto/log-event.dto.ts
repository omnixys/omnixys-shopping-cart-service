
export interface LogEventDTO {

    id: string;
    timestamp: string
    level: string
    message: string
    service: string
    context: string
    traceId?: string
}

// Beispielnutzung in LoggerPlus:
// const log = new LogEventDTO(uuid, now, 'INFO', message, serviceName, context, traceId);
