package fin.c3po.system;

import fin.c3po.common.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "system_settings")
public class SystemSettings extends BaseEntity {

    @Column(nullable = false)
    private boolean maintenanceEnabled = false;

    private Instant maintenanceStart;

    private Instant maintenanceEnd;

    @Column(length = 512)
    private String maintenanceMessage;

    @Column(nullable = false)
    private int passwordMinLength = 8;

    @Column(nullable = false)
    private boolean passwordRequireUppercase = true;

    @Column(nullable = false)
    private boolean passwordRequireNumber = true;

    @Column(nullable = false)
    private boolean passwordRequireSpecial = false;

    private Integer passwordExpiryDays;

    @Column(nullable = false)
    private int alertLoginFailureThreshold = 5;

    @Column(nullable = false)
    private int alertStorageUsagePercent = 80;

    @Column(nullable = false)
    private int alertJobQueueDelayMinutes = 10;
}


