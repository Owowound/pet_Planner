namespace Analytics.Application.Dto;

public record GeneralDto(
    int Completed,
    double? PercentComplete,
    double? StartPercentComplete);

public record TaskNodeDto(
    Guid TaskId,
    string Name,
    string Color,
    double OwnPercent,
    int Goal,
    int Progress,
    double TreePercent,
    bool IsCompleted,
    double? StartTreePercent,
    List<TaskNodeDto> Children,
    List<Guid> TagIds
);
