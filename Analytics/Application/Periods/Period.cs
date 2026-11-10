using Analytics.Application.Exceptions;

namespace Analytics.Application.Periods;

public record Period(DateTime? From, DateTime To)
{
    public bool IsAllTime => From is null;

    public bool Contains(DateTime moment) => (From is null || moment >= From) && moment < To;

    public static Period Create(DateTime? from, DateTime? to)
    {
        DateTime? start = from is null ? null : ToUtc(from.Value);
        var end = to is null ? DateTime.UtcNow : ToUtc(to.Value);

        if (start is not null && start >= end)
        {
            throw new InvalidPeriodException("Параметр from должен быть раньше to");
        }

        return new Period(start, end);
    }

    private static DateTime ToUtc(DateTime value) => value.Kind switch
    {
        DateTimeKind.Utc => value,
        DateTimeKind.Local => value.ToUniversalTime(),
        _ => DateTime.SpecifyKind(value, DateTimeKind.Utc),
    };
}
