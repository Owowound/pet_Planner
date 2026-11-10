namespace Analytics.Application.Exceptions;

public class InvalidPeriodException : Exception
{
    public InvalidPeriodException(string message) : base(message) { }
}
