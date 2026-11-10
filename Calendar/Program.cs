using Calendar.Api;
using Calendar.Api.Endpoints;
using Calendar.Application;
using Calendar.Application.Handlers;
using Calendar.Application.Handlers.Tags;
using Calendar.Infrastructure.DB;
using Calendar.Infrastructure.Messaging;
using Calendar.Infrastructure.Outbox;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("Calendar")
                       ?? throw new InvalidOperationException("Не найдена строка подключения 'Calendar' в appsettings.json");

builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(connectionString));

builder.Services.AddScoped<PlannerRepository>();
builder.Services.AddScoped<ItemFabric>();

builder.Services.AddScoped<CreateTaskHandler>();
builder.Services.AddScoped<EditTaskHandler>();
builder.Services.AddScoped<RemoveTaskHandler>();
builder.Services.AddScoped<AddProgressHandler>();
builder.Services.AddScoped<AddSubTaskHandler>();
builder.Services.AddScoped<GetTasksByDateHandler>();
builder.Services.AddScoped<GetTaskByIdHandler>();

builder.Services.AddScoped<TagFabric>();
builder.Services.AddScoped<CreateTagHandler>();
builder.Services.AddScoped<EditTagHandler>();
builder.Services.AddScoped<RemoveTagHandler>();

builder.Services.Configure<RabbitMqOptions>(builder.Configuration.GetSection("RabbitMq"));
builder.Services.AddHostedService<OutboxPublisher>();

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

app.MapTaskEndpoints();

app.Run();