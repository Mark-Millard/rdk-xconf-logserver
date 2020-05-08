W.defineModule("Log", [
], function(
) {

    var log = W.Class.extend({
        setLog: function(prefix, level) {
            if (prefix != undefined && typeof(prefix) == "object")
                this.prefix = "[" + prefix.constructor.name + "] ";
            else if (prefix != undefined)
                this.prefix = "[" + prefix + "] ";

            if (level != undefined) {
                this.level = level;
            }
        },
        error: function(msg) {
            if (this.level >= W.log.ERROR)
                W.log.error(this.prefix+msg);
        },
        info: function(msg) {
            if (this.level >= W.log.INFO)
                W.log.info(this.prefix+msg);
        },
        inspect: function(msg) {
            if (this.level >= W.log.INFO) {
                W.log.info(this.prefix);
                W.log.inspect(msg);
            }
        },
        warn: function(msg) {
            if (this.level >= W.log.WARN)
                W.log.warn(this.prefix+msg);
        },
        trace: function(msg) {
            if (this.level >= W.log.TRACE)
                W.log.trace(this.prefix+msg);
        },
        debug: function(msg, obj) {
            if (this.level >= W.log.DEBUG) {
                W.log.debug(msg);
                if (obj)
                    W.log.inspect(obj);
            }
        }
    });

    return log;
});
