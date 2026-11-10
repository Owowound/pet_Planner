using System.Text;
using Calendar.Infrastructure.DB;
using Calendar.Infrastructure.Messaging;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using RabbitMQ.Client;

namespace Calendar.Infrastructure.Outbox;

public class OutboxPublisher : BackgroundService
{
    private static readonly TimeSpan PollInterval = TimeSpan.FromSeconds(1);
    private static readonly TimeSpan ReconnectDelay = TimeSpan.FromSeconds(5);
    private const int BatchSize = 50;

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly RabbitMqOptions _options;
    private readonly ILogger<OutboxPublisher> _logger;

    public OutboxPublisher(IServiceScopeFactory scopeFactory, IOptions<RabbitMqOptions> options,
        ILogger<OutboxPublisher> logger)
    {
        _scopeFactory = scopeFactory;
        _options = options.Value;
        _logger = logger;
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

    private async Task RunAsync(CancellationToken ct)
    {
        var factory = new ConnectionFactory
        {
            HostName = _options.Host,
            Port = _options.Port,
            UserName = _options.User,
            Password = _options.Password,
        };

        await using var connection = await factory.CreateConnectionAsync(ct);
        await using var channel = await connection.CreateChannelAsync(cancellationToken: ct);

        await channel.ExchangeDeclareAsync(_options.Exchange, ExchangeType.Fanout, durable: true,
            cancellationToken: ct);

        _logger.LogInformation("Подключились к RabbitMQ {Host}:{Port}", _options.Host, _options.Port);

        while (!ct.IsCancellationRequested)
        {
            var sent = await PublishBatchAsync(channel, ct);

            if (sent < BatchSize)
            {
                await Task.Delay(PollInterval, ct);
            }
        }
    }

    private async Task<int> PublishBatchAsync(IChannel channel, CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var batch = await db.OutboxMessages
            .Where(m => m.ProcessedAt == null)
            .OrderBy(m => m.OccurredAt)
            .Take(BatchSize)
            .ToListAsync(ct);

        if (batch.Count == 0)
            return 0;

        var sent = 0;
        try
        {
            foreach (var message in batch)
            {
                var properties = new BasicProperties
                {
                    MessageId = message.Id.ToString(),
                    Type = message.Type,
                    ContentType = "application/json",
                    Persistent = true,
                };

                await channel.BasicPublishAsync(
                    exchange: _options.Exchange,
                    routingKey: string.Empty,
                    mandatory: false,
                    basicProperties: properties,
                    body: Encoding.UTF8.GetBytes(message.Payload),
                    cancellationToken: ct);

                message.MarkProcessed();
                sent++;
            }
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            batch[sent].MarkFailed(ex.Message);
            _logger.LogWarning(ex, "Не удалось отправить сообщение {Id}", batch[sent].Id);
            await db.SaveChangesAsync(CancellationToken.None);
            throw;
        }

        await db.SaveChangesAsync(ct);

        _logger.LogInformation("Отправлено сообщений: {Count}", sent);
        return sent;
    }
}