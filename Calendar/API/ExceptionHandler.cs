using System;
using System.Threading;
using System.Threading.Tasks;
using Calendar.Application.Exceptions;
using Calendar.Domain;
using Calendar.Domain.Exceptions;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace Calendar.Api;

public class ExceptionHandler : IExceptionHandler
{
    private readonly IProblemDetailsService _problemDetailsService;
    private readonly ILogger<ExceptionHandler> _logger;

    public ExceptionHandler(IProblemDetailsService problemDetailsService,
        ILogger<ExceptionHandler> logger)
    {
        _problemDetailsService = problemDetailsService;
        _logger = logger;
    }

    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception,
        CancellationToken cancellationToken)
    {
        var (status, title) = exception switch
        {
            NotFoundException => (StatusCodes.Status404NotFound, "Не найдено"),
            DomainException => (StatusCodes.Status400BadRequest, "Некорректные данные"),
            _ => (StatusCodes.Status500InternalServerError, "Внутренняя ошибка сервера")
        };

        if (status == StatusCodes.Status500InternalServerError)
            _logger.LogError(exception, "Необработанное исключение");

        httpContext.Response.StatusCode = status;

        return await _problemDetailsService.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = httpContext,
            Exception = exception,
            ProblemDetails = new ProblemDetails
            {
                Status = status,
                Title = title,
                Detail = status == StatusCodes.Status500InternalServerError ? null : exception.Message
            }
        });
    }
}