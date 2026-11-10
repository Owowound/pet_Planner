using Analytics.Domain;
using Microsoft.EntityFrameworkCore;

namespace Analytics.Infrastructure.DB;

public class AppDbContext : DbContext
{
    public DbSet<TaskFrame> TaskFrames { get; set; }
    public DbSet<DeleteFrame> DeleteFrames { get; set; }

    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<TaskFrame>()
            .HasKey(x => new { x.Id, x.FrameTime });

        modelBuilder.Entity<DeleteFrame>()
            .HasKey(x => x.TaskId);

        modelBuilder.Entity<DeleteFrame>()
            .HasIndex(x => x.FrameTime);
    }
}
