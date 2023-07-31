---
sidebar_label: 'Joining AD'
sidebar_position: 1
---

# Joining RHEL or any other Linux machine directly to Microsoft Active Directory

Managing access to Linux machines on your network can be challenging. I've seen admins create all users on all machines, others that share accounts using SSH keys or even passwords, and still others that use LDAP binding (sometimes using the existing Active Directory infrastructure and sometimes using a separate domain) which requires them to write LDAP queries to filter access. All these methods make managing access to machines difficult, and they require the admins to be informed when someone has left or joined a team. Shared accounts can make logging mostly useless as everyone will have the same username. And I'm probably not alone in having a bad experience with HR informing technical teams when there's a change to a team. However, there's a way I've found that works well and integrates with what is typically a pre-existing process.

Most companies I've come across have some form of ERP system that automatically creates, disables, or deletes user accounts in Microsoft Active Directory (AD), so let's take advantage of the work that others are doing. [SSSD](https://access.redhat.com/documentation/en-us/red_hat_enterprise_linux/8/html/configuring_authentication_and_authorization_in_rhel/understanding-sssd-and-its-benefits_configuring-authentication-and-authorization-in-rhel) can connect directly to AD. If you've ever set up an authentication server for Linux that had a trust to AD, you've had SSSD talk to your AD servers. If you look at [how a trust works](https://learn.microsoft.com/en-us/azure/active-directory-domain-services/concepts-forest-trust#kerberos-based-processing-of-authentication-requests-over-forest-trusts), the authentication server you set up returns a referral back to the AD servers causing SSSD to query your AD servers directly. The following setup skips the need for the extra authentication server and configures SSSD to go directly to AD first. 

The next question is typically how to control access. This is where [RBAC](https://www.dnsstuff.com/rbac-vs-abac-access-control#what-is-rbac) comes in. RBAC allows you to stop assigning access to users and start assigning access to roles. Once you have the groups laid out, you can assign a new team member to a team, which is already a part of the role with appropriate access to a group of servers. It removes the "I just got hired and need the same access as X" requests that reference a person who left months ago and had all of their access purged. Instead, once you add the new user to their team's group, they have the access they need. It also removes the discovery that someone who left the company over a year ago still has access to all the servers because nobody told the admins that that person left. When the ERP system automatically updates their AD account, they lose all access.


Managing AD from non-Windows operating systems was once challenging. However, Microsoft has released [Windows Admin Center](https://www.microsoft.com/en-us/windows-server/windows-admin-center) allowing you to access Active Directory Users and Computers directly from any browser running on any operating system. It also grants access to various other Windows management tools. It can be installed on a Windows server and then there’s no worrying about session limits or mucking around with RemoteApp. You just launch a browser and access the web interface.

## Configuring your AD groups for RBAC (Role Based Access Control)
Your company's naming scheme may differ from the examples in this article. The group names are not important. The essential part is the intended use of each group.

Because SSSD is not synchronizing AD groups, and instead is just getting a list of groups the user is a member of during the login process, missing groups don't prevent this setup from working. However, if you have multiple teams with delegated permissions within AD, it is recommended to create all of the groups to prevent them from being created in the incorrect organizational unit (OU) and giving the wrong team control over access.


### Access to specific machines
For each machine, create two groups. Both groups will include the short name of the machine.  
One group is for machine-specific `SSH` access (referred to as`<Machine_SSH_Access>` for the rest of this article).   
The other group is for machine-specific `sudo` access (referred to as `<Machine_SUDO_Access>` for the rest of the doc).

  Example:
  ```
  <DOMAIN> Linux <hostname> ssh access
  <DOMAIN> Linux <hostname> sudo access
  ```

  - `<hostname>` is the shortname of the machine  
  - `<DOMAIN>` is your domain's short name (optional)

### Access to all machines
Create two groups within Active Directory for global machine access.

One group is for SSH access to all machines (referred to as `<Global_SSH_Access>` for the rest of this article).
The other group is for sudo access to all machines (referred to as `<Global_SSH_Access>` for the rest of this article).

  Example:
  ```
  <DOMAIN> Linux ssh access
  <DOMAIN> Linux sudo access
  ```
  - `<DOMAIN>` is your domain's short name (optional)

### Nesting
Nesting within the AD groups is allowed. If you want to create a group with access to multiple machines, you do not need to change the configuration on the RHEL machines. Instead, you can make the new group a member of the access group for the specific machines. This approach allows you to control the access directly from AD.


Example nesting:
```
- CONTOSO Linux Webserver1 ssh access
  - CONTOSO Linux Webservers ssh access
    - CONTOSO Web Developers
      - User1
      - User2
```

This nesting allows you to assign roles (CONTOSO Web Developers) to groups of machines (CONTOSO Linux Webservers ssh access) instead of users to specific machines.

## Domain Joining your Linux machine
If your environment currently has RC4 enabled, please follow [Microsoft’s Security Advisory](https://learn.microsoft.com/en-us/security-updates/SecurityAdvisories/2013/2868725?redirectedfrom=MSDN) and disable it now.

1. Install required packages

    ```bash
    dnf install -y chrony krb5-workstation samba-common-tools oddjob-mkhomedir samba-common sssd authselect
    ```

    If you are not using RHEL or a related distro, the package names may differ slightly.

2. Add your domain’s CA chain
    Create `/etc/sssd/pki/sssd_auth_ca_db.pem` and write your domain’s CA chain. This does not need to include the certificate for the DCs themselves. It can start at the certificate that signed their certificates


3. Add the CA chain to the machine's trust anchors
    ```bash
    trust anchor /etc/sssd/pki/sssd_auth_ca_db.pem
    ```

4. Configure SSSD by editing `/etc/sssd/sssd.conf` or `/etc/sssd/conf.d/<DOMAIN>.conf` and match the following lines.
    Editing `/etc/sssd/conf.d/<DOMAIN>.conf` is the modern and preferred method, but editing `/etc/sssd/sssd.conf` also works.

    ```ini title="/etc/sssd/sssd.conf"
    [domain/<DOMAIN>]
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
    simple_allow_groups = <Global_SSH_Access>, <Global_SUDO_Access>, <Machine_SSH_Access>, <Machine_SUDO_Access>
    ignore_group_members = true
    ad_gpo_access_control = disabled
    ad_enable_gc = false
    [sssd]
    services = nss, pam
    config_file_version = 2
    domains = <DOMAIN>
    ```

    - `<DOMAIN>` is the FQDN of your domain in ALL CAPITALS. Authentication issues can occur if you do not use all capitals.  
    - `ldap_idmap_range_size` is optional. This is necessary if you have a large AD environment. Changing this value will cause the uid hash to change so make sure all machines have the same value and do not to change it once the machine is domain joined.  
    - `<Global_SSH_Access>`, `<Global_SUDO_Access>`, `<Machine_SSH_Access>`, and `<Machine_SUDO_Access>` are the AD groups you created above for RBAC

5. Set the permissions for the file you just wrote:  
    `/etc/sssd/sssd.conf` or `/etc/sssd/conf.d/<DOMAIN>.conf`

    ```bash
    chmod 400 /etc/sssd/sssd.conf
    ```
    
    or

    ```bash
    chmod 400 /etc/sssd/conf.d/*.conf
    ```

6. Configure KRB5 by editing /etc/krb5.conf and match these lines:

    ```ini title="/etc/krb5.conf"
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
    default_realm = <DOMAIN>

    [realms]

    [domain_realm]
    ```
    
    - `<DOMAIN>` is the FQDN of your domain in ALL CAPITALS. Authentication issues will occur if you do not use all capitals.  
    - You do not need to specify anything under `realms` or `domain_realm`. SSSD will automatically discover that information from DNS.

7. Configure SUDO access by creating a file in /etc/sudoers.d:
    
    ```bash
    visudo -f /etc/sudoers.d/<DOMAIN>
    ```

    ```sudo title="/etc/sudoers.d/<DOMAIN>"
    %<Global_SUDO_Access>  ALL=(ALL) ALL
    %<Machine_SUDO_Access>  ALL=(ALL) ALL
    ```

    :::tip 
    The file name can be anything you want, and doesn't have to be named `<DOMAIN>`
    :::

    :::tip Using spaces
    Make sure to escape any spaces with a `\`  
    Example: “Linux sudo access” becomes “Linux\ sudo\ access”
    :::

    :::tip
    `sudo` access to other AD groups can be defined the same way in separate files or in the same file.
    :::

8. Ensure the machine's hostname is set to the FQDN. The machine hostname cannot be the shortname

    ```bash
    hostnamectl set-hostname $(hostname -f)
    ```

9. Join the machine with one of the following commands (adcli is compatible with SMBv1 and SMBv2).

    To set the OS information within AD while joining, use the following command:  
      ```bash
      source /etc/os-release
      adcli join -U <join_user> --os-name="${NAME}" --os-version="${VERSION}" --os-service-pack="${VERSION_ID}"
      ```
   
   Alternately, you can join without setting the OS information:  
      ```bash
      adcli join -U <join_user>
      ```
      `<join_user>` is the AD account that will be used to join the machine to the domain. The password that adcli requests is not stored. [Delegated Permissions](https://www.mankier.com/8/adcli#Delegated_Permissions) describes the permissions required for joining

8. Enable and start SSSD and oddjobd
    ```bash
    systemctl enable sssd oddjobd
    systemctl restart sssd oddjobd
    ```

9. Enable logging in with AD
    ```bash
    authselect select sssd with-mkhomedir --force
    ```

As long as your account is a member of one of the groups you created, you can now log in to the machine. You don't need to specify the domain. The domain specified as the `default_realm` in `/etc/krb5.conf` is used. GNOME may require a restart, but sshd is typically happy to accept the changes without a restart.


## Keeping the OS information up to date

By default, the computer object doesn't have permission to update its own OS information. Make sure to go into Active Directory Users and Computers (ADUAC) and grant `SELF` the ability to write each of the OS fields on the computer objects (you can do this at the OU level). Once added, the following commands can be used to update the AD object with the latest OS information:

```bash
source /etc/os-release
/usr/sbin/adcli update --os-name="${NAME}" --os-version="${VERSION}" --os-service-pack="${VERSION_ID}"
```

This can either be added as a cron job or as a systemd service  
Example service:
```ini title="/etc/systemd/system/update-ad.service"
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
This section assumes you have smart card authentication working on your Windows machines. If not, configure smart card authentication on a Windows machine before proceeding.

1. Write the certificate chain for your domain to `/etc/sssd/pki/sssd_auth_ca_db.pem`. This does not need to include the certificate for the Domain Controllers (DCs) themselves. It can start with the certificate that signed their certificates.

2. Add the certificate to the machines trusted CA list.

    ```bash
    trust anchor /etc/sssd/pki/sssd_auth_ca_db.pem
    ```
3. Edit `/etc/sssd/sssd.conf` or `/etc/sssd/conf.d/<DOMAIN>.conf`, depending on which file you used when you domain joined your machine, and add the following line within the `[domain/<DOMAIN>]` section.  
    This entry tells SSSD where to look for the user certificate. Windows uses the attribute `userCertificate`, so if we use the same attribute, the same smart card works on both Linux and Windows.

    ```ini title="/etc/sssd/sssd.conf"
    ldap_user_certificate = userCertificate;binary
    ```

    Add these lines at the end of the same configuration file:
    ```ini title="/etc/sssd/sssd.conf"
    [pam]
    pam_cert_auth = true
    ```

4. Edit `/etc/krb5.conf` and add the following lines under `[realms]` replacing `<DOMAIN>` with your domain's FQDN in ALL CAPITALS. This is to resolve a mismatch that can occur because Linux is case senstive while Windows is not.

    ```ini title="/etc/krb5.conf"
    <DOMAIN> = {
      pkinit_anchors = DIR:/etc/sssd/pki
      pkinit_kdc_hostname = <DOMAIN>
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
On RHEL 8 and above, you can enable SSH access using a smart card.  
1. Verify that the smart card cert is read properly from AD:
    ```bash
    sss_ssh_authorizedkeys ${USER}
    ```
    If a public key is not returned, verify that smartcard authentication is configured properly
2. Edit `/etc/ssh/sshd_config` and add these lines
    ```ini title="/etc/ssh/sshd_config"
    AuthorizedKeysCommand /usr/bin/sss_ssh_authorizedkeys
    AuthorizedKeysCommandUser nobody
    ```
3. Restart `sshd`
    ```bash
    systemctl restart sshd
    ```

To log in from a client using SSH, use the option `PKCS11Provider=/usr/lib64/opensc-pkcs11.so``. As long as the smart card matches a public key for the user, you will be prompted for the smart card PIN or password:
```bash
ssh -o PKCS11Provider=/usr/lib64/opensc-pkcs11.so <host>
```

## Additional Information
- Disabling a user within AD will immediately block access to the machine. Just like with Windows, anyone who is already logged in will stay logged in.
- Modification to the user's groups is updated during login just like Windows. This is done before checking if they are allowed to log in.
- SSSD is site aware. If you configure sites within Sites and Services, SSSD will connect to the appropriate DC.
- SSSD will automatically rotate the computer password.
- SSSD will automatically create and manage the DNS records for the machine as long as dynamic updates (secure or insecure) are enabled.

I typically discourage using Windows tools to manage Linux systems and Linux tools to manage Windows because there are usually important features lost, security missing, or much easier ways to accomplish the same task with a native tool. However, it's different with AD. The developers of SSSD have done a lot of work to make it compatible with AD, and in the end that makes your job all the easier. Years ago, trying to use AD with Linux meant writing LDAP queries and creating mapping files. Nowadays, none of that is needed.