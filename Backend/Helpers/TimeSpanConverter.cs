using System.Text.Json;
using System.Text.Json.Serialization;
using System.Xml;

namespace ProjectManagementSystem1.Helpers
{
    public class TimeSpanConverter : JsonConverter<TimeSpan>
    {
        public override TimeSpan Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            //string value = reader.GetString();
            //if (string.IsNullOrEmpty(value)) return TimeSpan.Zero;
            //if (TimeSpan.TryParse(value, out TimeSpan result)) return result;
            //// Support ISO 8601 duration (e.g., "PT1H30M")
            //if (value.StartsWith("PT") && System.Xml.XmlConvert.ToTimeSpan(value) is TimeSpan isoResult)
            //    return isoResult;
            //throw new JsonException($"Invalid TimeSpan format: {value}. Use 'hh:mm:ss' or ISO 8601 (e.g., 'PT1H30M').");
            var value = reader.GetString();
            return TimeSpan.TryParse(value, out var ts) ? ts : XmlConvert.ToTimeSpan(value);
        }

        public override void Write(Utf8JsonWriter writer, TimeSpan value, JsonSerializerOptions options)
        {
            writer.WriteStringValue(value.ToString("c"));
        }
    }
}
