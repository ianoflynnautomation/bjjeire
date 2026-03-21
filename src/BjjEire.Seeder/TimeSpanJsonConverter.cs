using System.Text.Json;
using System.Text.Json.Serialization;

namespace BjjEire.Seeder;

public class TimeSpanJsonConverter : JsonConverter<TimeSpan>
{
    public override TimeSpan Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        => TimeSpan.Parse(reader.GetString() ?? "00:00:00", System.Globalization.CultureInfo.InvariantCulture);

    public override void Write(Utf8JsonWriter writer, TimeSpan value, JsonSerializerOptions options)
        => writer.WriteStringValue(value.ToString(@"hh\:mm\:ss", System.Globalization.CultureInfo.InvariantCulture));
}
