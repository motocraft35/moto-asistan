import android.content.Context;
import android.location.Location;
import android.os.Bundle;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;

@CapacitorPlugin(
  name = "BackgroundGeolocation",
  permissions = {
    @Permission(
      name = "background_location",
      description = "Required for background location"
    )
  }
)
public class BackgroundGeolocationPlugin extends Plugin {
  private BackgroundGeolocation backgroundGeolocation;

  @Override
  public void load() {
    backgroundGeolocation = new BackgroundGeolocation();
  }

  @PluginMethod
  public void start(PluginCall call) {
    backgroundGeolocation.start();
  }

  @PluginMethod
  public void stop(PluginCall call) {
    backgroundGeolocation.stop();
  }

  @PluginMethod
  public void addEventListener(PluginCall call) {
    backgroundGeolocation.addEventListener(call.getString("event"), call.getString("callback"));
  }

  @PluginMethod
  public void removeEventListener(PluginCall call) {
    backgroundGeolocation.removeEventListener(call.getString("event"), call.getString("callback"));
  }
}