using System.Text;
using System.Text.Json;
using Analytics.Application;
using Analytics.Domain;
using Analytics.Infrastructure.DB;
using Contracts;
using Microsoft.Extensions.Options;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;

namespace Analytics.Messaging;

public class EventsConsumer : BackgroundService
{
    private static readonly TimeSpan ReconnectDelay = TimeSpan.FromSeconds(5);

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        AllowOutOfOrderMetadataProperties = true,
    };

    private readonly RabbitMqOptions _options;
    private readonly ILogger<EventsConsumer> _logger;
    
    private readonly IServiceScopeFactory _scopeFactory;

    public EventsConsumer(IOptions<RabbitMqOptions> options, ILogger<EventsConsumer> logger,
        IServiceScopeFactory scopeFactory)
    {
        _options = options.Value;
        _logger = logger;
        _scopeFactory = scopeFactory;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await RunAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                return;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "RabbitMQ недоступен, повтор через {Delay} с", ReconnectDelay.TotalSeconds);
                await Task.Delay(ReconnectDelay, stoppingToken);
            }
        }
    }

    private async Task RunAsync(CancellationToken cancellationToken)
    {
        var factory = new ConnectionFactory
        {
            HostName = _options.Host,
            Port = _options.Port,
            UserName = _options.User,
            Password = _options.Password,
        };

        await using var connection = await factory.CreateConnectionAsync(cancellationToken);
        await using var channel = await connection.CreateChannelAsync(cancellationToken: cancellationToken);

        await channel.ExchangeDeclareAsync(_options.Exchange, ExchangeType.Fanout, durable: true,
            cancellationToken: cancellationToken);
        await channel.QueueDeclareAsync(_options.Queue, durable: true, exclusive: false, autoDelete: false,
            cancellationToken: cancellationToken);
        await channel.QueueBindAsync(_options.Queue, _options.Exchange, routingKey: string.Empty,
            cancellationToken: cancellationToken);

        await channel.BasicQosAsync(prefetchSize: 0, prefetchCount: 10, global: false, cancellationToken: cancellationToken);

        var consumer = new AsyncEventingBasicConsumer(channel);
        consumer.ReceivedAsync += async (_, ea) =>
        {
            var json = Encoding.UTF8.GetString(ea.Body.Span);

            IntegrationEvent? evt;
            try
            {
                evt = JsonSerializer.Deserialize<IntegrationEvent>(json, JsonOptions);
            }
            catch (JsonException ex)
            {
                _logger.LogError(ex, "Не удалось разобрать сообщение {Id}: {Json}", ea.BasicProperties.MessageId, json);
                await channel.BasicRejectAsync(ea.DeliveryTag, requeue: false, cancellationToken);
                return;
            }

            try
            {
                await HandleAsync(evt!, cancellationToken);
                await channel.BasicAckAsync(ea.DeliveryTag, multiple: false, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка обработки {Type} {Id}", evt!.GetType().Name, evt.EventId);
                await channel.BasicNackAsync(ea.DeliveryTag, multiple: false, requeue: true, cancellationToken);
            }
        };

        await channel.BasicConsumeAsync(_options.Queue, autoAck: false, consumer, cancellationToken);
        _logger.LogInformation("Слушаем очередь {Queue}", _options.Queue);

        await Task.Delay(Timeout.Infinite, cancellationToken);
    }

    private async Task HandleAsync(IntegrationEvent evt, CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var sp = scope.ServiceProvider;

        switch (evt)
        {
            case TaskUpserted e:
                await sp.GetRequiredService<FrameHandler>().Handle(e, cancellationToken);
                break;
            case TaskDeleted e:
                await sp.GetRequiredService<DeletedFrameHandler>().Handle(e, cancellationToken);
                break;
            default:
                _logger.LogWarning("Неизвестный тип события {Type}", evt.GetType().Name);
                break;
        }
    }
}