var builder = WebApplication.CreateBuilder(args);
builder.WebHost.UseUrls("http://localhost:5000/");

var app = builder.Build();
app.UseDefaultFiles();
app.UseStaticFiles();

const int DELAY_IN_SECONDS = 3;

app.MapGet("/fastEndpoint", () =>
{
    var searchResults = new[] { new { key = 1, value = "motor" }, new { key = 2, value = "motorcycle" }, new { key = 3, value = "motown" } };
    // return some arbitrary data just so we have something to see on the browsers console.
    return new { data = searchResults, serverTime = DateTime.Now.ToLongTimeString() };
});

app.MapGet("/slowEndpoint", async () =>
{
    await System.Threading.Tasks.Task.Delay(DELAY_IN_SECONDS * 1000);

    var searchResults = new[] { new { key = 1, value = "car" }, new { key = 2, value = "carpet" }, new { key = 3, value = "carrot" } };
    // return some arbitrary data just so we have something to see on the browsers console.
    return new { data = searchResults, delayInSeconds = DELAY_IN_SECONDS, serverTime = DateTime.Now.ToLongTimeString() };
});

app.MapGet("/simulateUndefinedResp", async (Microsoft.AspNetCore.Http.HttpContext context) =>
{
    await System.Threading.Tasks.Task.Delay(DELAY_IN_SECONDS * 1000);
    // calling Abort on the context kills the connection. The client won't know why the connection was dropped.
    // this is an easy way to simulate a server crash or a network partition.
    context.Abort();
    return;
});

app.Run();
