import android.os.Bundle;
import android.util.Log;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;

@CapacitorPlugin(
  name = "BackgroundService",
  permissions = {
    @Permission(
      name = "background_location",
      description = "Required for background location"
    )
  }
)
public class MainActivity extends BridgeActivity {
  private BackgroundService backgroundService;

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    backgroundService = new BackgroundService();
  }

  @PluginMethod
  public void startService(PluginCall call) {
    backgroundService.startService();
  }

  @PluginMethod
  public void stopService(PluginCall call) {
    backgroundService.stopService();
  }

  @PluginMethod
  public void addEventListener(PluginCall call) {
    backgroundService.addEventListener(call.getString("event"), call.getString("callback"));
  }

  @PluginMethod
  public void removeEventListener(PluginCall call) {
    backgroundService.removeEventListener(call.getString("event"), call.getString("callback"));
  }
}