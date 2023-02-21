var builder = WebApplication.CreateBuilder(args);

var app = builder.Build();
app.UseDefaultFiles();
app.UseStaticFiles();

app.MapGet("/Delay", async (int delayInSeconds, Microsoft.AspNetCore.Http.HttpContext context) =>
{
    var startTime = DateTime.Now;
    await System.Threading.Tasks.Task.Delay(delayInSeconds * 1000);
    var endTime = DateTime.Now;
    
    // return some arbitrary data just so we have something to see on the browsers console.
    return new {delayInSeconds = delayInSeconds, startTime = startTime.ToLongTimeString(), endTime = endTime.ToLongTimeString() };
});

app.MapGet("/Abort", async (int delayInSeconds, Microsoft.AspNetCore.Http.HttpContext context) =>
{
    await System.Threading.Tasks.Task.Delay(delayInSeconds * 1000);
    // calling Abort on the context kills the connection. The client won't know why the connection was dropped.
    // this is an easy way to simulate a server crash or a network partition.
    context.Abort();
    return;
});

app.Run();
