---
sidebar_label: 'Join AD'
sidebar_position: 1
---

# Joining RHEL or any other Linux machine directly to Microsoft Active Directory

Managing access to Linux systems is always a challenge. I've seen some people create all of their user's on all of their machines, others that will share accounts either through SSH keys or passwords, and others that will use LDAP binding (sometimes using the existing AD infrastructure and sometimes using a separate domain) that required them to write LDAP queries to filter access. All of these methods make managing access to machines difficult, require the administrators to be informed when someone is joining or leaves a team, and sometimes makes logging useless (shared accounts). I'm sure I'm also not alone in having a bad experience with HR informing the technical teams when there is a change to teams. However, there's a way I've found that works well and integrates with what is typically a pre-existing process. 

Most companies I have come across have some form of ERP system that will automatically create/disable/delete user accounts in Microsoft Active Directory (MS AD), so let's take advantage of the work that others are doing. [SSSD](https://access.redhat.com/documentation/en-us/red_hat_enterprise_linux/8/html/configuring_authentication_and_authorization_in_rhel/understanding-sssd-and-its-benefits_configuring-authentication-and-authorization-in-rhel) can connect directly to MS AD. If you've ever set up an authentication server for Linux that had a trust to AD, you've had SSSD talk to your AD servers. If you look at [how a trust works](https://learn.microsoft.com/en-us/azure/active-directory-domain-services/concepts-forest-trust#kerberos-based-processing-of-authentication-requests-over-forest-trusts), the authentication server you setup would have returned a referral back to the MS AD servers causing SSSD to query your AD servers directly. The following setup skips the need for the extra authentication server and configures SSSD to go directly to AD first.

The next question is typically how to control access. This is where RBAC comes in. RBAC gives you the ability to stop assigning access to users and start assigning access to roles. For a description of RBAC, please check out DNSStuff's article on [what is RBAC](https://www.dnsstuff.com/rbac-vs-abac-access-control#what-is-rbac). Once you have the groups laid out, a new team member can automatically be assigned to a team, which will already be a part of the role, which will already have the appropriate access to a group of servers. It removes the "I just got hired and need the same access as X" requests that reference a person that left months ago and has had all of their access purged. Instead, once they are added to their team's group, they'll have the access they need. It also removes the discoveries that someone that left the company over a year ago still has access to all of the servers because nobody told the administrators that that person left the company. When the ERP system automatically updates their AD account, they'll lose all access.

## Configuring your AD groups for RBAC (Role Based Access Control)
Your company's naming scheme may differ from the examples below. The name of the groups are not important. The important part is the intended use of each group.
Because SSSD is not synchronizing the AD groups and instead is just getting a list of groups the user is a part of as part of the login process, missing groups will not prevent this setup from working. However, if you have multiple teams with delegated permissions, it is recommended to at least create all of the groups to prevent them from being created in the wrong OU and giving the wrong team control over the access

### Access to specific machines
- For each machine create two groups. Both groups will include the short name of the machine.  
  One of the groups will be for machine specific `SSH` access (Referred to as `*Machine_SSH_Access*` for the rest of the doc).  
  The other will be machine specific `SUDO` access (Referred to as `*Machine_SUDO_Access*` for the rest of the doc).  

  Example:
  ```
  *DOMAIN* Linux *hostname* ssh access
  *DOMAIN* Linux *hostname* sudo access
  ```
  `*hostname*` is the shortname of the machine  
  `*DOMAIN*` is your domain's short name (optional)

### Access to all machines
- Create two groups for global machine access.  
  One of the groups will be for `SSH` access (Referred to as `*Global_SSH_Access*` for the rest of the doc) to all machines.  
  The other will be for `SUDO` access (Referred to as `*Global_SSH_Access*` for the rest of the doc) to all machines.  

  Example:
  ```
  *DOMAIN* Linux ssh access
  *DOMAIN* Linux sudo access
  ```
  `*DOMAIN*` is your domain's short name (optional)

### Nesting
Nesting within the AD groups is allowed. If you would like to create a group that has access to multiple machines, you do not need to change the configuration on the RHEL machine. Instead you can make the new group a member of the access group for the specific machines. This will allow you to control the access directly from AD.

Example nesting:
- CONTOSO Linux Webserver1 ssh access
  - CONTOSO Linux Webservers ssh access
    - CONTOSO Web Developers
      - User1
      - User2

This nesting will allow you to assign roles (CONTOSO Web Developers) to groups of machines (CONTOSO Linux Webservers ssh access) instead of users to specific machines.

## Domain Joining your Linux machine
1. Install required packages

    ```bash
    dnf install -y chrony krb5-workstation samba-common-tools oddjob-mkhomedir samba-common sssd authselect
    ```

    If you aren't using RHEL or a related distro, the package names may differ slightly.

2. Configure SSSD

    Edit `/etc/sssd/sssd.conf` and match the following lines:

    ```ini title="/etc/sssd/sssd.conf"
    [domain/*DOMAIN*]
    access_provider = simple
    auth_provider = ad
    chpass_provider = ad
    id_provider = ad
    dyndns_update = true
    override_homedir = /home/%u
    override_shell = /bin/bash
    default_shell = /bin/bash
    ldap_idmap_range_size = 4000000
    cache_credentials = true
    simple_allow_groups = *Global_SSH_Access*, *Global_SUDO_Access*, *Machine_SSH_Access*, *Machine_SUDO_Access*
    ignore_group_members = true
    ad_gpo_access_control = disabled
    ad_enable_gc = false
    [sssd]
    services = nss, pam
    config_file_version = 2
    domains = *DOMAIN*
    ```

    `*DOMAIN*` is the FQDN of your domain in ALL CAPITALS. Authentication issues will occur if you do not use all capitals.  
    `ldap_idmap_range_size` is optional. This is necessary if you have a large AD environment. Changing this value will cause the uid hash to change so make sure not to change it once the machine is domain joined.  
    `*Global_SSH_Access*`, `*Global_SUDO_Access*`, `*Machine_SSH_Access*`, and `*Machine_SUDO_Access*` are the AD groups you created above for RBAC

    If you would like to enable LDAPS (recommended), add the CA chain to the trust anchors and then add `ad_use_ldaps = true` under the domain section

3. Set the permissions for `/etc/sssd/sssd.conf`
    ```bash
    chmod 400 /etc/sssd/sssd.conf
    ```

4. Configure KRB5

    Edit `/etc/krb5.conf` and match the following lines
    ```ini
    [logging]
    default = FILE:/var/log/krb5libs.log
    kdc = FILE:/var/log/krb5kdc.log
    admin_server = FILE:/var/log/kadmind.log

    [libdefaults]
    dns_lookup_realm = true
    dns_lookup_kdc = true
    ticket_lifetime = 24h
    renew_lifetime = 7d
    forwardable = true
    rdns = true
    default_ccache_name = KEYRING:persistent:%{uid}
    default_realm = *DOMAIN*


    [realms]

    [domain_realm]
    ```
    `*DOMAIN*` is the FQDN of your domain in ALL CAPITALS. Authentication issues will occur if you do not use all capitals.  
    You do not need to specify anything under `realms` or `domain_realm`. SSSD will automatically discover that information from DNS.

5. Configure SUDO access

    Create a file in /etc/sudoers.d using `visudo -f /etc/sudoers.d/DOMAIN` and specify the default sudo access for members of the AD `SUDO` groups. The file name can be anything you want and does not have to be named `DOMAIN`.  
    :::tip Using spaces
    Make sure to escape any spaces with a `\`
    :::

      Example: `Linux sudo access` becomes `Linux\ sudo\ access`  
    ```sudo
    %*Global_SUDO_Access*   ALL=(ALL) ALL
    %*Machine_SUDO_Access*  ALL=(ALL) ALL
    ```
    `*Global_SUDO_Access*` and `*Machine_SUDO_Access*` are the AD groups you created above for RBAC.  
    The `%` before the group name indicates that it is a group

    Any other sudo access you would like to grant to AD groups can be defined the same way in separate files or in the same file

6. Ensure the machine's hostname is set to the FQDN. The machine hostname cannot be the shortname

    ```bash
    hostnamectl set-hostname $(hostname -f)
    ```

7. Join the machine with one of the following commands
    - Join with OS information. The OS information is only set during joining.
      ```bash
      source /etc/os-release
      adcli join -U *join_user* --os-name="${NAME}" --os-version="${VERSION}" --os-service-pack="${VERSION_ID}"
      ```
      `*join_user*` is the AD account that will be used to join the machine to the domain. The password that adcli prompts for will not be stored anywhere. [Delegated Permissions](https://www.mankier.com/8/adcli#Delegated_Permissions) describes the permissions required for joining
   - Join without OS information
      ```bash
      adcli join -U *join_user*
      ```
      `*join_user*` is the AD account that will be used to join the machine to the domain. The password that adcli prompts for will not be stored anywhere. [Delegated Permissions](https://www.mankier.com/8/adcli#Delegated_Permissions) describes the permissions required for joining

8. Enable and start SSSD and oddjobd
    ```bash
    systemctl enable sssd oddjobd
    systemctl restart sssd oddjobd
    ```

9. Enable logging in with AD
    ```bash
    authselect select sssd with-mkhomedir --force
    ```

As long as your account is a member of one of the groups that were created, you should now be able to log in to the machine. You do not need to specify the domain. The domain specified as the `default_realm` in `/etc/krb5.conf` will be used. Gnome is sometimes a little finicky and may require a restart, but SSHd is typically happy to accept the changes without a restart.

## Keeping the OS information up to date

By default, the computer object will not have enough permissions to update its own OS information. Make sure to go in to ADUAC (Active Directory Users and Computers) and grant `SELF` the ability to write each of the OS fields on the computer objects (this can be done at the OU level). Once added, the following commands can be used to update the AD object with the latest OS information

```bash
source /etc/os-release; /usr/sbin/adcli update --os-name="${NAME}" --os-version="${VERSION}" --os-service-pack="${VERSION_ID}"
```

This can either be added as a cron job or as a systemd service  
Example service:
```ini
[Unit]
Description=Updates AD with the current OS information
After=sssd.service

[Service]
Type=oneshot
EnvironmentFile=/etc/os-release
ExecStart=/usr/sbin/adcli update --os-name="${NAME}" --os-version="${VERSION}" --os-service-pack="${VERSION_ID}"

[Install]
WantedBy=multi-user.target
```

## Enabling Smartcard authentication
1. Write the certificate chain for your domain to `/etc/sssd/pki/sssd_auth_ca_db.pem`. This does not need to include the certificate for the DCs themselves. It can start at the certificate that signed their certificate
2. Add the certificate to the machines trusted CA list

    ```bash
    trust anchor /etc/sssd/pki/sssd_auth_ca_db.pem
    ```
3. Edit `/etc/sssd/sssd.conf`

    Add the following line within the `[domain/*DOMAIN*]` section. This will tell SSSD where to look for the certificate. `userCertificate` is the same location Windows uses so the same smartcard will work on both Linux and Windows
    ```ini
    ldap_user_certificate = userCertificate;binary
    ```

    Add the following lines at the end of `/etc/sssd/sssd.conf`
    ```ini
    [pam]
    pam_cert_auth = true
    ```
4. Edit `/etc/krb5.conf` and add the following lines under `[realms]` replacing `*DOMAIN*` with your domain's FQDN in all uppercase. This is to resolve a mismatch that can occur because Linux is case senstive while Windows is not.

    ```ini
    *DOMAIN* = {
      pkinit_anchors = DIR:/etc/sssd/pki
      pkinit_kdc_hostname = *DOMAIN*
    }
    ```

5. Use one of the following commands to enable smartcard authentication in PAM
   - `authselect enable-feature with-smartcard`  
     This will allow smartcard authentication as an option
   - `authselect enable-feature with-smartcard-required`  
     This will require smartcard authentication. Please remember that, by default, SSHd will not call PAM when authenticating with SSH keys
   - `authselect enable-feature with-smartcard-lock-on-removal`  
     This will require smartcard authentication and will lock the machine when the smartcard is removed. Please remember that, by default, SSHd will not call PAM when authenticating with SSH keys

### Enable SSH access using the smartcard certificate
This only seems to work on RHEL 8 or above.  
1. Verify that the smartcard cert will be read properly from AD by running the following command
    ```bash
    sss_ssh_authorizedkeys ${USER}
    ```
    If a public key is not returned, verify that smartcard authentication is configured properly
2. Edit `/etc/ssh/sshd_config` and add the following lines
    ```ini
    AuthorizedKeysCommand /usr/bin/sss_ssh_authorizedkeys
    AuthorizedKeysCommandUser nobody
    ```
3. Restart `sshd`
    ```bash
    systemctl restart sshd
    ```

To SSH from a client, use the `ssh` option `PKCS11Provider /usr/lib64/opensc-pkcs11.so`. If the smartcard matches a public key for the user, it will then prompt for the smartcard pin/password.  
```bash
ssh -o PKCS11Provider=/usr/lib64/opensc-pkcs11.so *host*
```



## Testing that has been done
- Disabling a user within AD will immediately block access to the machine.  
  Just like with Windows, anyone who is already logged in will stay logged in.
- Modification to the user's groups is updated during login just like Windows. This is done before checking if they are allowed to log in.
- SSSD is site aware. If you configure sites within `Sites and Services`, SSSD will connect to the appropriate DC.
