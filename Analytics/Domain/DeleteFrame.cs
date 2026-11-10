namespace Analytics.Domain;

public class DeleteFrame
{
    public Guid TaskId { get; private set; }
    public DateTime FrameTime  { get; private set; }
    
    public DeleteFrame(Guid taskId, DateTime frameTime)
    {
        TaskId = taskId;
        FrameTime = frameTime;
    }
}