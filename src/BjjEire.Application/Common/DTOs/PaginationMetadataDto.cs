
namespace BjjEire.Application.Common.DTOs;

public class PaginationMetadataDto {

     public PaginationMetadataDto() { }
     
    public int TotalItems { get; init; }
    public int CurrentPage { get; init; }
    public int PageSize { get; init; }
    public int TotalPages { get; init; }
    public bool HasNextPage { get; init; }
    public bool HasPreviousPage { get; init; }
    public string? NextPageUrl { get; init; }
    public string? PreviousPageUrl { get; init; }
}