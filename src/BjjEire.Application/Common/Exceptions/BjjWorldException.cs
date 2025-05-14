
namespace BjjEire.Application.Common.Exceptions;

[Serializable]
public class BjjWorldException : Exception {

    public BjjWorldException() {
    }

    public BjjWorldException(string message)
        : base(message) {
    }

}