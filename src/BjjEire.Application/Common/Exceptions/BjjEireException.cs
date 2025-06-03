
namespace BjjEire.Application.Common.Exceptions;

[Serializable]
public class BjjEireException : Exception
{

    public BjjEireException()
    {
    }

    public BjjEireException(string message)
        : base(message)
    {
    }

}
