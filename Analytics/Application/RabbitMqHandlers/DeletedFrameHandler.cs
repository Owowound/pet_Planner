using Analytics.Domain;
using Analytics.Infrastructure.DB;
using Contracts;

namespace Analytics.Application;

public class DeletedFrameHandler
{
    private readonly AnalyticsRepository _analyticsRepository;

    public DeletedFrameHandler(AnalyticsRepository analyticsRepository)
    {
        _analyticsRepository = analyticsRepository;
    }

    public async Task Handle(TaskDeleted deleted, CancellationToken cancellationToken)
    {
        foreach (var id in deleted.TaskIds.Distinct())
        {
            if (!await _analyticsRepository.DeleteFrameExistsAsync(id, cancellationToken))
            {
                _analyticsRepository.AddDeleteFrame(new DeleteFrame(id, deleted.DeletedAt));
            }
        }

        await _analyticsRepository.SaveChangesAsync(cancellationToken);
    }
}
