using Calendar.Domain.Exceptions;

namespace Calendar.Domain.Color;

public static class ColorRules
{
    public static string Normalize(string? color)
    {
        if (color == null || color.Length != 7 || color[0] != '#' || !color.AsSpan(1).ContainsOnlyHexDigits())
        {
            throw new DomainException("Цвет должен быть в формате #RRGGBB");
        }

        return color.ToLowerInvariant();
    }

    private static bool ContainsOnlyHexDigits(this ReadOnlySpan<char> span)
    {
        foreach (var c in span)
        {
            if (!char.IsAsciiHexDigit(c)) return false;
        }

        return true;
    }
}