
using System.ComponentModel.DataAnnotations;

namespace BjjWorld.Application.Common;

public class BaseApiEntityModel {
    [Key] public required string Id { get; set; }
    public DateTime CreatedOnUtc { get; set; }
    public DateTime? UpdatedOnUtc { get; set; }
}