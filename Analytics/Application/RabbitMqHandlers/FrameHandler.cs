using Analytics.Domain;
using Analytics.Infrastructure.DB;
using Contracts;

namespace Analytics.Application;

public class FrameHandler
{
    private readonly AnalyticsRepository _analyticsRepository;

    public FrameHandler(AnalyticsRepository analyticsRepository)
    {
        _analyticsRepository = analyticsRepository;
    }

    public async Task Handle(TaskUpserted upserted, CancellationToken cancellationToken)
    {
        if (await _analyticsRepository.FrameExistsAsync(upserted.TaskId, upserted.UpdatedAt, cancellationToken))
        {
            return;
        }

        var taskExists = await _analyticsRepository.IsTaskExistsAsync(upserted.TaskId, cancellationToken);

        var state = !taskExists ? FrameState.TaskCreated
                  : upserted.IsCompleted ? FrameState.TaskCompleted
                  : FrameState.TaskEdited;

        _analyticsRepository.AddTaskFrame(new TaskFrame(upserted, state));
        
        await _analyticsRepository.SaveChangesAsync(cancellationToken);
    }
}
