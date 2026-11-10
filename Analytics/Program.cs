using Analytics.API;
using Analytics.Application;
using Analytics.Application.EndpointHandlers;
using Analytics.Application.Snapshots;
using Analytics.Infrastructure.DB;
using Analytics.Messaging;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("Analytics")
                       ?? throw new InvalidOperationException("Не найдена строка подключения 'Analytics' в appsettings.json");

builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(connectionString));

builder.Services.AddScoped<AnalyticsRepository>();

builder.Services.AddScoped<FrameHandler>();
builder.Services.AddScoped<DeletedFrameHandler>();

builder.Services.AddScoped<SnapshotReader>();
builder.Services.AddScoped<GeneralStatsHandler>();
builder.Services.AddScoped<ProgressStatisticsHandler>();

builder.Services.Configure<RabbitMqOptions>(builder.Configuration.GetSection("RabbitMq"));
builder.Services.AddHostedService<EventsConsumer>();

builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<ExceptionHandler>();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

app.UseExceptionHandler();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapAnalyticsEndpoints();

app.Run();
